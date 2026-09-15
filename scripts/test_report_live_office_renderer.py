import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("report_live_office_renderer.py")
SPEC = importlib.util.spec_from_file_location("report_live_office_renderer", MODULE_PATH)
renderer = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(renderer)


def table(headers, rows):
    return [headers, *rows]


class OfficeRendererPlanTests(unittest.TestCase):
    def artifact(self):
        slide_ids = ["c0", "c4", "p1_serasa"]
        slides = [
            {"slide_instance_id": value, "slide_code": "C0" if value == "c0" else "C4" if value == "c4" else "P1",
             "source_view": "VIEW_RUN_MANIFEST" if value == "c0" else "VIEW_PACING_ISODAYS" if value == "c4" else "VP_SERASA_RESULT",
             "partner": "Serasa" if value.startswith("p1") else None,
             "confidence_label": "Alta", "confidence_status": "confirmed"}
            for value in slide_ids
        ]
        geometry = {"visual": {"x": 28, "y": 184, "width": 438, "height": 158},
                    "narrative": {"x": 480, "y": 100, "width": 212, "height": 255}}
        blueprints = [
            {"slide_instance_id": value, "blueprint": {"narrative": "LEITURA DA DECISÃO\n\nTexto.",
              "visual": {"archetype": "scorecard", "geometry": geometry}}}
            for value in slide_ids
        ]
        tabs = {
            "VIEW_REGISTRY": table(
                ["slide_instance_id", "title"],
                [["c0", "Capa"], ["c4", "Ritmo"], ["p1_serasa", "Resultado Serasa"]],
            ),
            "VIEW_RUN_MANIFEST": table(
                ["campo", "valor"],
                [["report_profile", "deep_dive"], ["quality_status", "suspect"],
                 ["source_cutoffs", '{"crm":"2026-08-31"}']],
            ),
            "VIEW_EDITORIAL_LAYOUTS": table(
                ["slide_instance_id", "support_text"],
                [["c4", "Mesmo dia."], ["p1_serasa", "Lead pré-qualificado."]],
            ),
            "VIEW_PACING_ISODAYS": table(
                ["day_of_period", "cumulative_cards", "previous_equivalent_cumulative_cards"],
                [[1, 10, 8], [2, 20, 16]],
            ),
            "VIEW_EDITORIAL_RULERS": table(
                ["slide_instance_id", "metric_order", "metric_label", "value_text", "delta_text", "range_text", "verdict_text"],
                [["p1_serasa", 1, "Cartões", "20", "+25,0%", "faixa 10-30", "dentro"],
                 ["p1_serasa", 2, "CAC", "R$ 7,20", "-18,0%", "faixa R$ 6-R$ 9", "dentro"]],
            ),
        }
        return {
            "artifact_version": "1", "run_id": "11111111-1111-4111-8111-111111111111",
            "period_start": "2026-08-01", "period_end": "2026-08-31", "report_profile": "deep_dive",
            "versions": {"spec": "3.0", "renderer": "2.2"}, "slides": slides,
            "slide_blueprints": blueprints, "tabs": tabs,
        }

    def test_plan_uses_artifact_geometry_and_data(self):
        plan = renderer.build_render_plan(self.artifact())
        self.assertEqual([item["slide_instance_id"] for item in plan["slides"]], list(renderer.DEFAULT_SLIDES))
        pacing = plan["slides"][1]
        self.assertEqual(pacing["geometry"]["visual"]["x"], 28)
        self.assertEqual(pacing["summary"], {"current": 20.0, "previous": 16.0, "delta": 0.25})
        self.assertEqual(plan["slides"][2]["metrics"][1]["value"], "R$ 7,20")

    def test_unknown_slide_and_wrong_spec_fail_closed(self):
        artifact = self.artifact()
        with self.assertRaisesRegex(ValueError, "ausente"):
            renderer.build_render_plan(artifact, ["c9"])
        artifact["versions"]["spec"] = "2.0"
        with self.assertRaisesRegex(ValueError, "3.0"):
            renderer.build_render_plan(artifact)

    def test_download_identity_must_match_signed_response(self):
        artifact = self.artifact()
        artifact["content_hash"] = "abc123"
        renderer.validate_artifact_identity(
            artifact, "11111111-1111-4111-8111-111111111111", "abc123",
        )
        with self.assertRaisesRegex(ValueError, "run_id"):
            renderer.validate_artifact_identity(artifact, "outro-run", "abc123")
        with self.assertRaisesRegex(ValueError, "content_hash"):
            renderer.validate_artifact_identity(
                artifact, "11111111-1111-4111-8111-111111111111", "outro-hash",
            )


if __name__ == "__main__":
    unittest.main()
