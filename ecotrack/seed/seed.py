#!/usr/bin/env python3
"""
EcoTrack — Seed Script
Generates realistic data using Faker + psycopg2
Targets: 50 companies, 300 facilities, 200 users, 500 suppliers,
         800 relationships, 10000+ emissions, 5000+ shipments,
         300 offsets, 20 frameworks, 400 compliance, 2000+ audit logs
"""

import os
import random
from datetime import date, timedelta
from faker import Faker  # type: ignore
import psycopg2  # type: ignore
from psycopg2.extras import execute_values, Json as PgJson  # type: ignore

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgres://ecotrack_user:ecotrack_pass@localhost:5432/ecotrack"
)

fake = Faker()
random.seed(42)
Faker.seed(42)

FACILITY_TYPES = ["warehouse", "factory", "office", "port", "farm"]
ROLES = ["admin", "manager", "analyst", "supplier", "viewer"]
TRANSPORT_MODES = ["road", "sea", "air", "rail", "inland_waterway"]
SCOPES = [1, 2, 3]

TRANSPORT_FACTORS = {
    "air": 0.602,
    "road": 0.062,
    "sea": 0.008,
    "rail": 0.022,
    "inland_waterway": 0.019,
}

REAL_FRAMEWORKS = [
    ("GHG Protocol", "Global", 2050),
    ("ISO 14064", "Global", 2030),
    ("EU CSRD", "European Union", 2030),
    ("EU ETS", "European Union", 2030),
    ("SEC Climate Rule", "USA", 2025),
    ("UK SECR", "United Kingdom", 2030),
    ("TCFD", "Global", 2030),
    ("Science Based Targets (SBTi)", "Global", 2050),
    ("CDP Climate", "Global", 2030),
    ("Paris Agreement NDC", "Global", 2030),
    ("California AB 32", "USA", 2030),
    ("Australia NGER", "Australia", 2030),
    ("Japan GHG Reporting", "Japan", 2030),
    ("Canada OBPS", "Canada", 2030),
    ("South Korea ETS", "South Korea", 2030),
    ("China National ETS", "China", 2030),
    ("Switzerland CO2 Act", "Switzerland", 2030),
    ("New Zealand ETS", "New Zealand", 2050),
    ("Singapore Carbon Tax", "Singapore", 2030),
    ("India PAT Scheme", "India", 2030),
]

SCOPE3_ACTIVITY_TYPES = [
    "Purchased Goods - Steel",
    "Purchased Goods - Plastics",
    "Purchased Goods - Electronics",
    "Purchased Goods - Chemicals",
    "Upstream Transport - Road",
    "Upstream Transport - Sea",
    "Upstream Transport - Air",
    "Business Travel - Air",
    "Employee Commuting",
    "Waste in Operations",
    "Use of Sold Products",
    "End-of-Life Treatment",
]

SCOPE1_ACTIVITY_TYPES = [
    "Natural Gas Boiler",
    "Diesel Generator",
    "Company Vehicle Fleet",
    "Process Emissions",
    "Fugitive Refrigerant",
    "On-site Combustion",
]

SCOPE2_ACTIVITY_TYPES = [
    "Grid Electricity",
    "Renewable Grid Electricity",
    "District Heating",
    "District Cooling",
]

def random_date(start_year=2020, end_year=2024) -> date:
    start = date(start_year, 1, 1)
    end = date(end_year, 12, 31)
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def seed():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("Seeding companies…")
    companies = []
    industries = ["Manufacturing", "Logistics", "Energy", "Retail", "Technology",
                  "Agriculture", "Construction", "Mining", "Chemicals", "Automotive"]
    for _ in range(50):
        companies.append((
            fake.company(),
            random.choice(industries),
            fake.country(),
            fake.bothify(text="??#########", letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
            random.randint(1950, 2020),
        ))
    execute_values(cur,
        "INSERT INTO company (name, industry, country, tax_id, founded_year) VALUES %s RETURNING company_id",
        companies)
    company_ids = [row[0] for row in cur.fetchall()]
    conn.commit()
    print(f"  {len(company_ids)} companies created")

    print("Seeding facilities…")
    facilities = []
    for _ in range(300):
        facilities.append((
            random.choice(company_ids),
            fake.company() + " Facility",
            f"{fake.city()}, {fake.country_code()}",
            random.choice(FACILITY_TYPES),
            round(random.uniform(500, 50000), 2),
        ))
    execute_values(cur,
        "INSERT INTO facility (company_id, name, location, facility_type, size_sqm) VALUES %s RETURNING facility_id",
        facilities)
    facility_ids = [row[0] for row in cur.fetchall()]
    conn.commit()
    print(f"  {len(facility_ids)} facilities created")

    # Map facility -> company
    cur.execute("SELECT facility_id, company_id FROM facility")
    fac_company = {row[0]: row[1] for row in cur.fetchall()}

    print("Seeding app_users…")
    users = []
    used_emails = set()
    for _ in range(200):
        email = fake.unique.email()
        while email in used_emails:
            email = fake.unique.email()
        used_emails.add(email)
        users.append((
            random.choice(company_ids),
            email,
            fake.sha256(),  # password_hash placeholder
            random.choice(ROLES),
            fake.name(),
        ))
    execute_values(cur,
        "INSERT INTO app_user (company_id, email, password_hash, role, full_name) VALUES %s RETURNING user_id",
        users)
    user_ids = [row[0] for row in cur.fetchall()]
    conn.commit()
    print(f"  {len(user_ids)} users created")

    print("Seeding suppliers…")
    suppliers = []
    for _ in range(500):
        suppliers.append((
            fake.company(),
            fake.country(),
            round(random.uniform(0, 10), 1),
            random.choice([True, False]),
            random_date(2022, 2024) if random.random() > 0.15 else None,
        ))
    execute_values(cur,
        "INSERT INTO supplier (name, country, sustainability_rating, verified, last_submission_date) VALUES %s RETURNING supplier_id",
        suppliers)
    supplier_ids = [row[0] for row in cur.fetchall()]
    conn.commit()
    print(f"  {len(supplier_ids)} suppliers created")

    print("Seeding supplier_relationships…")
    relationships = set()
    while len(relationships) < 800:
        c = random.choice(company_ids)
        s = random.choice(supplier_ids)
        relationships.add((c, s))
    execute_values(cur,
        "INSERT INTO supplier_relationship (company_id, supplier_id, since_date) VALUES %s ON CONFLICT DO NOTHING",
        [(c, s, random_date(2018, 2022)) for c, s in relationships])
    conn.commit()
    print(f"  {len(relationships)} relationships created")

    print("Seeding regulatory_frameworks…")
    execute_values(cur,
        "INSERT INTO regulatory_framework (name, jurisdiction, target_year) VALUES %s",
        REAL_FRAMEWORKS)
    cur.execute("SELECT framework_id FROM regulatory_framework")
    framework_ids = [row[0] for row in cur.fetchall()]
    conn.commit()
    print(f"  {len(framework_ids)} frameworks created")

    print("Seeding emission_activities (10000+)…")
    emissions = []
    for _ in range(10500):
        scope = random.choices([1, 2, 3], weights=[25, 25, 50])[0]
        fac_id = random.choice(facility_ids)
        sup_id = random.choice(supplier_ids) if scope == 3 else None

        if scope == 1:
            co2e = round(random.uniform(500, 50000), 4)
            atype = random.choice(SCOPE1_ACTIVITY_TYPES)
        elif scope == 2:
            co2e = round(random.uniform(200, 20000), 4)
            atype = random.choice(SCOPE2_ACTIVITY_TYPES)
        else:
            co2e = round(random.uniform(1000, 200000), 4)
            atype = random.choice(SCOPE3_ACTIVITY_TYPES)

        emissions.append((
            fac_id,
            sup_id,
            random.choice(user_ids),
            scope,
            atype,
            co2e,
            random_date(),
            fake.sentence() if random.random() > 0.7 else None,
        ))
    execute_values(cur,
        """INSERT INTO emission_activity
           (facility_id, supplier_id, recorded_by, scope, activity_type, co2e_kg, activity_date, notes)
           VALUES %s""",
        emissions)
    conn.commit()
    print(f"  {len(emissions)} emission activities created")

    print("Seeding shipments (5000+)…")
    shipments = []
    for _ in range(5200):
        mode = random.choice(TRANSPORT_MODES)
        distance = round(random.uniform(50, 25000), 2)
        weight = round(random.uniform(100, 80000), 2)
        factor = TRANSPORT_FACTORS[mode]
        co2e = round((distance * weight / 1000) * factor, 4)
        shipments.append((
            random.choice(supplier_ids),
            random.choice(company_ids),
            mode,
            distance,
            weight,
            co2e,
            random_date(),
        ))
    execute_values(cur,
        """INSERT INTO shipment
           (supplier_id, company_id, transport_mode, distance_km, weight_kg, co2e_kg, shipment_date)
           VALUES %s""",
        shipments)
    conn.commit()
    print(f"  {len(shipments)} shipments created")

    print("Seeding carbon_offsets…")
    PROJECTS = [
        ("Amazon Rainforest REDD+", "VCS"),
        ("Kenya Wind Farm", "Gold Standard"),
        ("Solar Cookstoves Ghana", "Gold Standard"),
        ("Nordic Reforestation", "VCS"),
        ("Methane Capture Brazil", "VCS"),
        ("Mangrove Restoration Indonesia", "Plan Vivo"),
        ("Solar PV India", "Gold Standard"),
        ("Biogas Uganda", "Gold Standard"),
        ("Ocean Kelp Farming", "VCS"),
        ("Avoided Deforestation Colombia", "VCS"),
    ]
    offsets = []
    for _ in range(300):
        project, cert = random.choice(PROJECTS)
        purchased = round(random.uniform(50, 2000), 4)
        retired = round(random.uniform(0, purchased), 4)
        offsets.append((
            random.choice(company_ids),
            project,
            cert,
            purchased,
            retired,
            random_date(2021, 2024),
        ))
    execute_values(cur,
        """INSERT INTO carbon_offset
           (company_id, project_name, certification_body, credits_purchased, credits_retired, purchase_date)
           VALUES %s""",
        offsets)
    conn.commit()
    print(f"  {len(offsets)} carbon offsets created")

    print("Seeding compliance_records…")
    periods = ["2020-Q1","2020-Q2","2020-Q3","2020-Q4",
               "2021-Q1","2021-Q2","2021-Q3","2021-Q4",
               "2022-Q1","2022-Q2","2022-Q3","2022-Q4",
               "2023-Q1","2023-Q2","2023-Q3","2023-Q4",
               "2024-Q1","2024-Q2","2024-Q3","2024-Q4"]
    statuses = ["compliant", "non_compliant", "pending"]
    compliance = []
    seen_compliance = set()
    while len(compliance) < 400:
        c = random.choice(company_ids)
        f = random.choice(framework_ids)
        p = random.choice(periods)
        key = (c, f, p)
        if key in seen_compliance:
            continue
        seen_compliance.add(key)
        target = round(random.uniform(10000, 500000), 4)
        variance = random.uniform(0.7, 1.4)
        actual = round(target * variance, 4)
        status = "compliant" if actual <= target else "non_compliant"
        if random.random() < 0.1:
            status = "pending"
        compliance.append((c, f, p, target, actual, status))
    execute_values(cur,
        """INSERT INTO compliance_record
           (company_id, framework_id, reporting_period, target_co2e, actual_co2e, status)
           VALUES %s""",
        compliance)
    conn.commit()
    print(f"  {len(compliance)} compliance records created")

    print("Seeding audit_logs (2000+)…")
    tables = ["emission_activity", "shipment", "supplier", "carbon_offset", "compliance_record", "facility"]
    actions = ["INSERT", "UPDATE", "DELETE"]
    audit = []
    for _ in range(2500):
        audit.append((
            random.choice(user_ids),
            random.choice(actions),
            random.choice(tables),
            random.randint(1, 1000),
            {"note": fake.sentence(), "changed_by": fake.name()},
        ))
    execute_values(cur,
        "INSERT INTO audit_log (user_id, action, table_name, record_id, details) VALUES %s",
        [(u, a, t, r, PgJson(d)) for u, a, t, r, d in audit])
    conn.commit()
    print(f"  {len(audit)} audit logs created")

    cur.close()
    conn.close()
    print("\n✅ Seeding complete!")


if __name__ == "__main__":
    seed()
