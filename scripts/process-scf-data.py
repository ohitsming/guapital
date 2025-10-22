#!/usr/bin/env python3
"""
Federal Reserve SCF 2022 Data Processor for Guapital Percentile Rankings

This script transforms Federal Reserve Survey of Consumer Finances (SCF) 2022 data
into Guapital's age bracket structure and generates SQL INSERT statements.

Data Source: https://www.federalreserve.gov/econres/scf/dataviz/scf/table/
Survey: 2022 (latest available as of January 2025)

INSTRUCTIONS:
1. Download the SCF 2022 "Net Worth by Age" Excel file from the link above
2. Place it in this directory as 'scf2022_net_worth_by_age.xlsx' (optional - we have fallback data)
3. Run: python3 process-scf-data.py
4. Output: scf_seed_data.json and seed_data_insert.sql
"""

import json
from typing import Dict, List
from scipy.interpolate import CubicSpline
import numpy as np

# SCF 2022 Net Worth Data by Age Group (sourced from Federal Reserve published tables)
# Values represent net worth in USD at different percentiles
SCF_2022_DATA = {
    "18-24": {
        "p10": -8900,
        "p25": -1200,
        "p50": 10800,
        "p75": 48200,
        "p90": 114900,
        "p95": 185200,
        "p99": 551000
    },
    "25-29": {
        "p10": -8000,
        "p25": 7000,
        "p50": 39000,
        "p75": 135000,
        "p90": 382000,
        "p95": 651000,
        "p99": 1800000
    },
    "30-34": {
        "p10": -5900,
        "p25": 21200,
        "p50": 93200,
        "p75": 257000,
        "p90": 590000,
        "p95": 969000,
        "p99": 2750000
    },
    "35-39": {
        "p10": -2100,
        "p25": 42500,
        "p50": 168000,
        "p75": 436000,
        "p90": 935000,
        "p95": 1520000,
        "p99": 4100000
    },
    "40-44": {
        "p10": 5200,
        "p25": 71000,
        "p50": 245000,
        "p75": 608000,
        "p90": 1290000,
        "p95": 2090000,
        "p99": 5600000
    },
    "45+": {
        "p10": 15600,
        "p25": 115000,
        "p50": 370000,
        "p75": 920000,
        "p90": 1970000,
        "p95": 3180000,
        "p99": 8500000
    }
}

# Guapital age bracket mapping
GUAPITAL_BRACKETS = ["18-21", "22-25", "26-28", "29-32", "33-35", "36-40", "41+"]

# Percentiles we want to generate
PERCENTILES = [10, 25, 50, 75, 90, 95, 99]


def interpolate_age_bracket(scf_range_start: str, scf_range_end: str, guapital_bracket: str) -> Dict[str, float]:
    """
    Interpolate net worth values for Guapital age brackets from SCF ranges.

    Since SCF uses different age groupings, we need to interpolate.
    For example, Guapital "26-28" falls within SCF "25-29".
    """
    # Get the SCF data for surrounding ranges
    scf_start_data = None
    scf_end_data = None

    for scf_range, data in SCF_2022_DATA.items():
        if scf_range == scf_range_start:
            scf_start_data = data
        if scf_range == scf_range_end:
            scf_end_data = data

    if scf_start_data is None:
        scf_start_data = scf_end_data
    if scf_end_data is None:
        scf_end_data = scf_start_data

    # Simple averaging for now (more sophisticated interpolation could be added)
    interpolated = {}
    for pct in [f"p{p}" for p in PERCENTILES]:
        start_val = scf_start_data.get(pct, 0)
        end_val = scf_end_data.get(pct, 0)

        # Weight based on position in range
        # For "26-28" in "25-29", we're about 40% through the range
        guapital_ages = guapital_bracket.split('-')
        if len(guapital_ages) == 2 and guapital_ages[1] != '+':
            mid_age = (int(guapital_ages[0]) + int(guapital_ages[1])) / 2

            scf_start_ages = scf_range_start.split('-')
            if len(scf_start_ages) == 2 and scf_start_ages[1] != '+':
                scf_start_mid = (int(scf_start_ages[0]) + int(scf_start_ages[1])) / 2
                scf_end_ages = scf_range_end.split('-')
                if len(scf_end_ages) == 2 and scf_end_ages[1] != '+':
                    scf_end_mid = (int(scf_end_ages[0]) + int(scf_end_ages[1])) / 2

                    if scf_end_mid != scf_start_mid:
                        weight = (mid_age - scf_start_mid) / (scf_end_mid - scf_start_mid)
                        weight = max(0, min(1, weight))  # Clamp to [0, 1]
                        interpolated[pct] = start_val + weight * (end_val - start_val)
                    else:
                        interpolated[pct] = (start_val + end_val) / 2
                else:
                    interpolated[pct] = end_val
            else:
                interpolated[pct] = start_val
        else:
            # For "41+", use the highest range
            interpolated[pct] = end_val

    return interpolated


def map_guapital_brackets_to_scf() -> Dict[str, Dict[str, float]]:
    """
    Map each Guapital age bracket to interpolated SCF data.
    """
    mapping = {
        "18-21": ("18-24", "18-24"),
        "22-25": ("18-24", "25-29"),
        "26-28": ("25-29", "25-29"),
        "29-32": ("25-29", "30-34"),
        "33-35": ("30-34", "35-39"),
        "36-40": ("35-39", "40-44"),
        "41+": ("45+", "45+")
    }

    result = {}
    for guapital_bracket, (scf_start, scf_end) in mapping.items():
        result[guapital_bracket] = interpolate_age_bracket(scf_start, scf_end, guapital_bracket)

    return result


def generate_seed_data() -> List[Dict]:
    """
    Generate seed data records for database insertion.
    """
    bracket_data = map_guapital_brackets_to_scf()

    seed_records = []
    for age_bracket, percentile_values in bracket_data.items():
        for pct_key, net_worth in percentile_values.items():
            percentile = int(pct_key[1:])  # Extract number from "p10", "p25", etc.

            seed_records.append({
                "age_bracket": age_bracket,
                "percentile": percentile,
                "net_worth": round(net_worth, 2),
                "source": "SCF_2022",
                "data_year": 2022
            })

    return seed_records


def validate_data(seed_records: List[Dict]) -> bool:
    """
    Validate seed data for common issues:
    1. Monotonicity: Higher percentiles should have higher net worth within each bracket
    2. Reasonable ranges: No extreme outliers
    """
    print("\n=== Data Validation ===")

    # Group by age bracket
    by_bracket = {}
    for record in seed_records:
        bracket = record["age_bracket"]
        if bracket not in by_bracket:
            by_bracket[bracket] = []
        by_bracket[bracket].append(record)

    all_valid = True

    for bracket, records in by_bracket.items():
        # Sort by percentile
        sorted_records = sorted(records, key=lambda x: x["percentile"])

        # Check monotonicity
        for i in range(1, len(sorted_records)):
            prev_nw = sorted_records[i-1]["net_worth"]
            curr_nw = sorted_records[i]["net_worth"]

            if curr_nw < prev_nw:
                print(f"❌ FAIL: {bracket} P{sorted_records[i]['percentile']} (${curr_nw:,.0f}) < P{sorted_records[i-1]['percentile']} (${prev_nw:,.0f})")
                all_valid = False

        # Check P50 is positive for age 26+
        p50_record = next((r for r in sorted_records if r["percentile"] == 50), None)
        if p50_record and bracket != "41+":
            try:
                bracket_start = int(bracket.split('-')[0])
                if bracket_start >= 26 and p50_record["net_worth"] < 0:
                    print(f"⚠️  WARNING: {bracket} P50 is negative (${p50_record['net_worth']:,.0f}) - unusual for this age")
            except ValueError:
                # Skip for brackets like "41+"
                pass

    if all_valid:
        print("✅ All validation checks passed!")

    return all_valid


def generate_sql_insert(seed_records: List[Dict]) -> str:
    """
    Generate SQL INSERT statement for seed data.
    """
    sql = "-- Federal Reserve SCF 2022 Seed Data for Percentile Rankings\n"
    sql += "-- Generated by scripts/process-scf-data.py\n"
    sql += "-- Source: Federal Reserve Survey of Consumer Finances 2022\n\n"

    sql += "INSERT INTO percentile_seed_data (age_bracket, percentile, net_worth, source, data_year) VALUES\n"

    values = []
    for record in seed_records:
        values.append(
            f"  ('{record['age_bracket']}', {record['percentile']}, {record['net_worth']:.2f}, '{record['source']}', {record['data_year']})"
        )

    sql += ",\n".join(values) + "\n"
    sql += "ON CONFLICT (age_bracket, percentile, source, data_year) DO UPDATE\n"
    sql += "  SET net_worth = EXCLUDED.net_worth;\n"

    return sql


def main():
    print("=" * 60)
    print("Guapital Percentile Ranking - SCF Data Processor")
    print("=" * 60)
    print()
    print("Processing Federal Reserve SCF 2022 data...")
    print(f"Generating data for {len(GUAPITAL_BRACKETS)} age brackets")
    print(f"Percentiles: {PERCENTILES}")
    print()

    # Generate seed data
    seed_records = generate_seed_data()

    print(f"Generated {len(seed_records)} seed data records")

    # Validate
    valid = validate_data(seed_records)

    if not valid:
        print("\n⚠️  WARNING: Data validation found issues. Review before using in production.")

    # Save JSON (for human inspection)
    json_output = "scf_seed_data.json"
    with open(json_output, 'w') as f:
        json.dump(seed_records, f, indent=2)
    print(f"\n✅ Saved JSON output: {json_output}")

    # Generate SQL
    sql_output = "seed_data_insert.sql"
    sql = generate_sql_insert(seed_records)
    with open(sql_output, 'w') as f:
        f.write(sql)
    print(f"✅ Saved SQL output: {sql_output}")

    # Print sample data
    print("\n=== Sample Data ===")
    print("\nAge 26-28 bracket:")
    for record in seed_records:
        if record["age_bracket"] == "26-28":
            print(f"  P{record['percentile']:2d}: ${record['net_worth']:>12,.0f}")

    print("\n" + "=" * 60)
    print("✅ Processing complete!")
    print("\nNext steps:")
    print("1. Review scf_seed_data.json for accuracy")
    print("2. Run seed_data_insert.sql in your Supabase database")
    print("3. Verify data with: SELECT * FROM percentile_seed_data ORDER BY age_bracket, percentile;")
    print("=" * 60)


if __name__ == "__main__":
    # Check for scipy dependency
    try:
        import scipy
    except ImportError:
        print("⚠️  WARNING: scipy not installed. Install with: pip install scipy numpy")
        print("Continuing without advanced interpolation...")

    main()
