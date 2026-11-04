"""Plan insert-only intake from NORMALIZED records and a frozen database state.

This is not a raw-file parser or a database writer. See SKILL.md.
"""
import argparse
from collections import Counter
from datetime import date
import hashlib
import json
import math
from pathlib import Path


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"), allow_nan=False)


def identity(dataset, record, fields):
    values = {}
    for field in fields:
        value = record.get(field)
        if value is None or value == "" or isinstance(value, (dict, list, bool)):
            raise ValueError("missing_or_invalid_identity:" + field)
        values[field] = value
    return canonical([dataset, values])


def business_day(value):
    if not isinstance(value, str) or len(value) != 10 or date.fromisoformat(value).isoformat() != value:
        raise ValueError("invalid_business_date")
    return value


def plan(registry, records, state):
    if not isinstance(records, list) or not all(isinstance(record, dict) for record in records) or not isinstance(state, dict):
        raise ValueError("normalized_records_array_and_frozen_state_object_required")
    datasets = {d["dataset_id"]: d for d in registry["datasets"]}
    if len(datasets) != len(registry["datasets"]):
        raise ValueError("duplicate_dataset_contract")
    existing, checkpoints = {}, {}
    for saved in state.get("existing", []):
        dataset = datasets[saved["dataset_id"]]
        key = identity(saved["dataset_id"], saved, dataset["key_fields"])
        existing[key] = saved
    for checkpoint in state.get("checkpoints", []):
        dataset = datasets[checkpoint["dataset_id"]]
        key = identity(checkpoint["dataset_id"], checkpoint["partition"], dataset["partition_fields"])
        if key in checkpoints:
            raise ValueError("duplicate_checkpoint_partition")
        checkpoints[key] = business_day(checkpoint["closed_through"])

    decisions, first_by_key = [], {}
    for index, record in enumerate(records):
        item = {"index": index, "dataset_id": record.get("dataset_id")}
        dataset = datasets.get(item["dataset_id"])
        if not dataset:
            decisions.append({**item, "status": "blocked_unknown_dataset"})
            continue
        try:
            day = business_day(record.get(dataset["date_field"]))
            key = identity(item["dataset_id"], record, dataset["key_fields"])
            partition = identity(item["dataset_id"], record, dataset["partition_fields"])
            if not record.get("source_contract_version"):
                raise ValueError("missing_source_contract_version")
            measures = record.get("measures")
            if not isinstance(measures, dict):
                raise ValueError("missing_measures")
            if set(measures) - set(dataset["measure_fields"]):
                raise ValueError("unknown_measure")
            if dataset["measure_fields"] and not measures:
                raise ValueError("empty_measures")
            for value in measures.values():
                if value is not None and (isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value)):
                    raise ValueError("measure_not_finite_number_or_null")
            fingerprint = canonical(record)
        except (ValueError, TypeError) as error:
            decisions.append({**item, "status": "blocked_invalid_record", "reason": str(error)})
            continue

        item["key_sha256"] = hashlib.sha256(key.encode()).hexdigest()
        if key in existing:
            item["status"] = "ignored_existing_key"
            if "measures" in existing[key]:
                item["changed_measures_ignored"] = canonical(existing[key]["measures"]) != canonical(measures)
        elif dataset["time_policy"] == "append_new_periods" and day <= checkpoints.get(partition, "0001-01-01"):
            item["status"] = "ignored_closed_period"
        elif key in first_by_key:
            earlier = first_by_key[key]
            if earlier["fingerprint"] == fingerprint and decisions[earlier["decision_index"]]["status"] != "blocked_conflicting_duplicate":
                item["status"] = "ignored_duplicate_in_file"
            else:
                decisions[earlier["decision_index"]]["status"] = "blocked_conflicting_duplicate"
                item["status"] = "blocked_conflicting_duplicate"
        else:
            item["status"] = "candidate_new" if dataset["table_status"] == "exists" else "blocked_target_not_created"
            first_by_key[key] = {"fingerprint": fingerprint, "decision_index": len(decisions)}
        decisions.append(item)

    candidates = [records[d["index"]] for d in decisions if d["status"] == "candidate_new"]
    candidate_datasets = {record["dataset_id"] for record in candidates}
    potential_consumers = [
        {"query_contract": contract["query_contract"], "status": contract["status"],
         "dataset_ids": sorted(candidate_datasets.intersection(contract["upstream_dataset_ids"])),
         "notes": contract["note_dependencies"], "outputs": contract["output_consumers"]}
        for contract in registry.get("report_contracts", [])
        if candidate_datasets.intersection(contract["upstream_dataset_ids"])
    ]
    return {
        "schema": "gaas-portfolio-increment-plan/1",
        "catalog_version": registry["version"],
        "mode": "local_plan_only",
        "database_written": False,
        "can_apply": False,
        "remaining_gate": "registered_raw_adapter_and_governed_writer_required",
        "counts": dict(Counter(d["status"] for d in decisions)),
        "decisions": decisions,
        "candidates": candidates,
        "potential_consumers": potential_consumers,
        "reports_refreshed": False,
        "editorial_check": "after_certification_only" if candidates else "no_new_candidates",
    }


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"), parse_constant=lambda token: (_ for _ in ()).throw(ValueError("invalid_JSON_number:" + token)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--registry", default=str(Path(__file__).resolve().parents[1] / "references" / "data-catalog.json"))
    parser.add_argument("--records", required=True, help="JSON array of normalized records; not an XLSX/PPTX")
    parser.add_argument("--state", required=True, help="Frozen existing keys and per-partition closed_through checkpoints")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    if Path(args.out).resolve() in {Path(path).resolve() for path in [args.registry, args.records, args.state]}:
        raise ValueError("output_must_not_overwrite_inputs")
    result = plan(read_json(args.registry), read_json(args.records), read_json(args.state))
    Path(args.out).write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(canonical({"mode": result["mode"], "can_apply": False, "counts": result["counts"]}))


if __name__ == "__main__":
    main()
