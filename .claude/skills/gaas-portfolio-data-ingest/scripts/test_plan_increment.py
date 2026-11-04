import importlib.util
import json
from pathlib import Path
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("plan_increment", HERE / "plan_increment.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
REGISTRY = json.loads((HERE.parent / "references" / "data-catalog.json").read_text(encoding="utf-8"))


def dispatch(identifier, day="2026-11-01", sent=0, channel="email"):
    return {"dataset_id": "insurance_dispatch", "source_contract_version": "fixture/1", "source_system": "sfmc", "source_account_code": "BU1", "source_dispatch_id": identifier, "channel_code": channel, "business_date": day, "measures": {"sent": sent, "communication_cost": None}}


class IncrementPlanTest(unittest.TestCase):
    def test_existing_key_changed_values_never_overwrites_and_history_is_ignored(self):
        state = {"existing": [dispatch("already", sent=100)], "checkpoints": [{"dataset_id": "insurance_dispatch", "partition": {"source_system": "sfmc", "source_account_code": "BU1", "channel_code": "email"}, "closed_through": "2026-10-31"}]}
        result = module.plan(REGISTRY, [dispatch("already", sent=900), dispatch("old", "2026-10-30"), dispatch("new")], state)
        self.assertEqual([d["status"] for d in result["decisions"]], ["ignored_existing_key", "ignored_closed_period", "candidate_new"])
        self.assertTrue(result["decisions"][0]["changed_measures_ignored"])
        self.assertEqual(result["candidates"][0]["measures"], {"sent": 0, "communication_cost": None})
        self.assertFalse(result["database_written"])
        self.assertFalse(result["can_apply"])

    def test_whole_batch_uses_frozen_partition_checkpoint_not_latest_row_in_file(self):
        records = [dispatch("newer", "2026-11-03"), dispatch("earlier_new", "2026-11-01"), dispatch("other_channel", "2026-10-30", channel="sms")]
        state = {"checkpoints": [{"dataset_id": "insurance_dispatch", "partition": {"source_system": "sfmc", "source_account_code": "BU1", "channel_code": "email"}, "closed_through": "2026-10-31"}]}
        result = module.plan(REGISTRY, records, state)
        self.assertEqual(result["counts"], {"candidate_new": 3})

    def test_duplicate_new_identity_with_conflicting_values_blocks_both(self):
        result = module.plan(REGISTRY, [dispatch("conflict", sent=1), dispatch("same", sent=0), dispatch("conflict", sent=2), dispatch("same", sent=0)], {})
        self.assertEqual(result["counts"], {"blocked_conflicting_duplicate": 2, "candidate_new": 1, "ignored_duplicate_in_file": 1})
        self.assertEqual(result["candidates"], [dispatch("same", sent=0)])

    def test_missing_identity_unknown_measure_and_uncreated_table_are_blocked(self):
        missing = dispatch("")
        unknown_measure = dispatch("metric"); unknown_measure["measures"]["made_up_contracts"] = 10
        proposed = {"dataset_id": "editorial_evidence", "business_date": "2026-10-30", "source_contract_version": "fixture/1", "source_sha256": "a" * 64, "source_locator": "slide8", "evidence_kind": "hypothesis", "measures": {}}
        result = module.plan(REGISTRY, [missing, unknown_measure, proposed], {})
        self.assertEqual(result["counts"], {"blocked_invalid_record": 2, "blocked_target_not_created": 1})
        self.assertEqual(result["candidates"], [])


if __name__ == "__main__":
    unittest.main()
