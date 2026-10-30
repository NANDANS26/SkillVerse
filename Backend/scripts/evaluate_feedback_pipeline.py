# Backend/scripts/evaluate_feedback_pipeline.py
"""
SkillVerse Phase 14: Recommendation Feedback and Evaluation Data Pipeline
Offline inspection and reporting utility for explicit judgments, implicit outcomes,
and synthetic benchmarks.
"""

import sys
import json
import urllib.request
import urllib.error
import os

API_BASE_URL = os.environ.get("SKILLVERSE_API_URL", "http://127.0.0.1:3000")

def fetch_evaluation_report(api_url: str):
    """
    Fetches the aggregated evaluation report from the core backend.
    """
    url = f"{api_url}/api/analytics/recommendations/evaluation"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "SkillVerse-Evaluation-Pipeline/1.0",
            # If internal service token or mock auth is supported
            "Content-Type": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        # If authentication is required at router level, perform signin
        if e.code == 401 or e.code == 403:
            return None
    except Exception as e:
        print(f"[Warning] Could not connect to API ({e}). Falling back to service-layer execution.")
        return None

def run_evaluation_pipeline():
    print("=" * 80)
    print(" SKILLVERSE PHASE 14: RECOMMENDATION FEEDBACK & EVALUATION DATA PIPELINE")
    print(" Provenance Partitioning: Explicit Judgments | Implicit Outcomes | Synthetic")
    print("=" * 80)

    # 1. Attempt live API retrieval or node service execution
    import subprocess
    node_cmd = [
        "node", "-e",
        """
        import('./src/services/feedback.service.js').then(async m => {
          const res = await m.getEvaluationDataset();
          console.log('__EVAL_DATA__' + JSON.stringify(res));
          process.exit(0);
        }).catch(err => {
          console.error(err);
          process.exit(1);
        });
        """
    ]
    try:
        proc = subprocess.run(
            node_cmd,
            cwd=os.path.join(os.path.dirname(__file__), ".."),
            capture_output=True,
            text=True,
            check=True
        )
        out_line = [line for line in proc.stdout.splitlines() if line.startswith("__EVAL_DATA__")][0]
        report = json.loads(out_line.replace("__EVAL_DATA__", ""))
    except Exception as e:
        print(f"[Error] Failed to query evaluation dataset: {e}")
        sys.exit(1)

    eval_status = report.get("evaluation_status", "UNKNOWN")
    notice = report.get("status_notice", "")
    partitions = report.get("provenance_partitions", {})

    print(f"\n[EVALUATION STATUS] {eval_status}")
    print(f"[STATUS NOTICE]     {notice}")
    print("\n" + "-" * 80)
    print(" PARTITION A: EXPLICIT RELEVANCE JUDGMENTS")
    print("-" * 80)

    part_a = partitions.get("partition_a_explicit_judgments", {})
    total_ratings = part_a.get("total_ratings", 0)
    unique_students = part_a.get("unique_students", 0)
    mean_rating = part_a.get("mean_rating")
    print(f"Total Explicit Ratings Submitted:   {total_ratings}")
    print(f"Unique Rating Students:             {unique_students}")
    print(f"Mean Rating Score (1-5 Scale):      {mean_rating if mean_rating is not None else 'N/A'}")

    rating_dist = part_a.get("rating_distribution", [])
    if rating_dist:
        print("\nRating Breakdown:")
        for r in rating_dist:
            print(f"  * {r.get('rating')} Stars: {r.get('count')} ratings")
    else:
        print("\nRating Breakdown: No ratings recorded yet.")

    reason_cats = part_a.get("reason_categories", [])
    if reason_cats:
        print("\nReason Categories Breakdown:")
        for rc in reason_cats:
            print(f"  - {rc.get('reason_category')}: {rc.get('count')} times")
    else:
        print("\nReason Categories Breakdown: None submitted.")

    print("\n" + "-" * 80)
    print(" PARTITION B: IMPLICIT BEHAVIORAL OUTCOMES")
    print("-" * 80)

    part_b = partitions.get("partition_b_implicit_outcomes", {})
    total_impressions = part_b.get("total_impressions", 0)
    total_presentations = part_b.get("total_presentations", 0)
    observed_students = part_b.get("observed_students", 0)
    interactions = part_b.get("interactions", {})
    rates = part_b.get("rates", {})

    print(f"Total Recommendation Impressions:   {total_impressions}")
    print(f"Total Recommendation Presentations: {total_presentations}")
    print(f"Unique Observed Students:           {observed_students}")
    print("\nLifecycle Action Counts:")
    print(f"  - Opened/Inspected:    {interactions.get('opened', 0)}")
    print(f"  - Started:             {interactions.get('started', 0)}")
    print(f"  - Progress Recorded:   {interactions.get('progress_recorded', 0)}")
    print(f"  - Completed:           {interactions.get('completed', 0)}")
    print(f"  - Dismissed:           {interactions.get('dismissed', 0)}")

    print("\nOutcome Rates (Defensible Denominators):")
    print(f"  - Feedback Coverage (Ratings / Impressions):     {rates.get('feedback_coverage', 0) * 100:.2f}%")
    print(f"  - Activity Start Rate (Starts / Impressions):    {rates.get('start_rate', 0) * 100:.2f}%")
    print(f"  - Completion Rate (Completions / Starts):        {rates.get('completion_rate', 0) * 100:.2f}%")
    print(f"  - Dismissal Rate (Dismissals / Impressions):     {rates.get('dismissal_rate', 0) * 100:.2f}%")

    print("\n" + "-" * 80)
    print(" PARTITION C: SYNTHETIC BENCHMARK FIXTURES")
    print("-" * 80)

    part_c = partitions.get("partition_c_synthetic_benchmark", {})
    print(f"Benchmark Suite:      {part_c.get('benchmark_name')}")
    print(f"Model Version:        {part_c.get('model_version')}")
    print(f"Synthetic Personas:   {part_c.get('synthetic_personas_count')}")
    print(f"Catalogue Pool:       {part_c.get('synthetic_catalog_count')} activities")
    print("Synthetic Metrics:")
    metrics = part_c.get("reported_metrics", {})
    for m_name, vals in metrics.items():
        print(f"  - {m_name:<20}: Baseline={vals.get('baseline')} | AI Model={vals.get('ai')} ({vals.get('delta')})")
    print(f"\nProvenance Disclaimer: {part_c.get('disclaimer')}")

    print("\n" + "=" * 80)
    if eval_status == "INSUFFICIENT_REAL_WORLD_DATA":
        print(" [SAFEGUARD DIRECTIVE] Empirical student feedback sample is insufficient (N < 10).")
        print(" Model weights and ranking formula remain UNCHANGED.")
        print(" Online automatic retraining is explicitly DISABLED.")
    else:
        print(" [DATA SUFFICIENT] Sufficient empirical feedback collected for offline analysis.")
    print("=" * 80)

if __name__ == "__main__":
    run_evaluation_pipeline()
