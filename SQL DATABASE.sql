

CREATE DATABASE ecotrack;
\c ecotrack;

-- ============================================================
-- SCHEMA CREATION
-- ============================================================

-- Root Entity: Company
CREATE TABLE company (
    company_id    SERIAL PRIMARY KEY,
    name          VARCHAR(200) NOT NULL,
    industry      VARCHAR(100),
    country       VARCHAR(100) NOT NULL,
    tax_id        VARCHAR(50) UNIQUE,
    founded_year  INT CHECK (founded_year > 1800),
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Facility: Physical locations of a company
CREATE TABLE facility (
    facility_id   SERIAL PRIMARY KEY,
    company_id    INT NOT NULL REFERENCES company(company_id) ON DELETE CASCADE,
    name          VARCHAR(200) NOT NULL,
    location      VARCHAR(300),
    country       VARCHAR(100),
    facility_type VARCHAR(50) CHECK (facility_type IN ('warehouse','factory','office','port','farm')),
    size_sqm      NUMERIC(12,2)
);

-- App User: System users (named app_user to avoid SQL reserved word)
CREATE TABLE app_user (
    user_id       SERIAL PRIMARY KEY,
    company_id    INT NOT NULL REFERENCES company(company_id),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(200),
    role          VARCHAR(50) CHECK (role IN ('admin','sustainability_manager','analyst','supplier','viewer')),
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Supplier: External supplier profiles
CREATE TABLE supplier (
    supplier_id           SERIAL PRIMARY KEY,
    name                  VARCHAR(200) NOT NULL,
    country               VARCHAR(100),
    sustainability_rating NUMERIC(3,1) CHECK (sustainability_rating BETWEEN 0 AND 10),
    verified              BOOLEAN DEFAULT FALSE,
    last_submission_date  DATE
);

-- Supplier Relationship: M:N junction table between company and supplier
CREATE TABLE supplier_relationship (
    company_id   INT REFERENCES company(company_id),
    supplier_id  INT REFERENCES supplier(supplier_id),
    since_date   DATE,
    PRIMARY KEY (company_id, supplier_id)
);

-- Emission Activity: Core fact table for Scope 1, 2, 3 emissions
CREATE TABLE emission_activity (
    activity_id     SERIAL PRIMARY KEY,
    facility_id     INT REFERENCES facility(facility_id),
    supplier_id     INT REFERENCES supplier(supplier_id),
    scope           SMALLINT NOT NULL CHECK (scope IN (1,2,3)),
    category        VARCHAR(100),
    activity_type   VARCHAR(150) NOT NULL,
    quantity        NUMERIC(14,4) NOT NULL,
    unit            VARCHAR(50) NOT NULL,
    emission_factor NUMERIC(12,6),
    co2e_kg         NUMERIC(16,4),
    activity_date   DATE NOT NULL,
    recorded_by     INT REFERENCES app_user(user_id)
);

-- Shipment: Logistics emission events
CREATE TABLE shipment (
    shipment_id    SERIAL PRIMARY KEY,
    supplier_id    INT REFERENCES supplier(supplier_id),
    company_id     INT REFERENCES company(company_id),
    origin         VARCHAR(200),
    destination    VARCHAR(200),
    transport_mode VARCHAR(50) CHECK (transport_mode IN ('road','sea','air','rail','inland_waterway')),
    distance_km    NUMERIC(10,2),
    weight_kg      NUMERIC(14,2),
    fuel_liters    NUMERIC(12,2),
    co2e_kg        NUMERIC(16,4),
    shipment_date  DATE NOT NULL
);

-- Carbon Offset: Credit purchase and retirement records
CREATE TABLE carbon_offset (
    offset_id         SERIAL PRIMARY KEY,
    company_id        INT NOT NULL REFERENCES company(company_id),
    project_name      VARCHAR(300) NOT NULL,
    certification     VARCHAR(100),
    credits_purchased NUMERIC(14,4),
    credits_retired   NUMERIC(14,4),
    purchase_date     DATE,
    vintage_year      INT
);

-- Regulatory Framework: Reference data for standards and regulations
CREATE TABLE regulatory_framework (
    framework_id SERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    jurisdiction VARCHAR(100),
    target_year  INT,
    description  TEXT
);

-- Compliance Record: Target vs actual emissions per framework
CREATE TABLE compliance_record (
    record_id        SERIAL PRIMARY KEY,
    company_id       INT NOT NULL REFERENCES company(company_id),
    framework_id     INT NOT NULL REFERENCES regulatory_framework(framework_id),
    reporting_period VARCHAR(20),
    target_co2e      NUMERIC(18,4),
    actual_co2e      NUMERIC(18,4),
    status           VARCHAR(30) CHECK (status IN ('compliant','non_compliant','pending','exceeded'))
);

-- Audit Log: Full trail of all data changes
CREATE TABLE audit_log (
    log_id     SERIAL PRIMARY KEY,
    user_id    INT REFERENCES app_user(user_id),
    action     VARCHAR(50),
    table_name VARCHAR(100),
    record_id  INT,
    old_value  TEXT,
    new_value  TEXT,
    log_time   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SAMPLE DATA INSERTION (FOR INITIAL TESTING)
-- ============================================================

-- Companies
INSERT INTO company (name, industry, country, tax_id, founded_year) VALUES
    ('EcoCorp Global',      'Manufacturing',  'Germany',     'DE123456789', 1995),
    ('GreenTrade BV',       'Logistics',      'Netherlands', 'NL987654321', 2003),
    ('SolarSupply GmbH',    'Energy',         'Austria',     'AT456789123', 2010),
    ('BioPackaging AB',     'Packaging',      'Sweden',      'SE321654987', 2008),
    ('CleanChain Inc.',     'Consulting',     'USA',         'US111222333', 2015);

-- Facilities
INSERT INTO facility (company_id, name, location, facility_type, size_sqm) VALUES
    (1, 'Berlin Main Factory',     'Berlin, DE',      'factory',   15000.00),
    (1, 'Hamburg Warehouse',       'Hamburg, DE',     'warehouse',  8000.00),
    (2, 'Rotterdam Port Hub',      'Rotterdam, NL',   'port',       5000.00),
    (3, 'Vienna Solar Office',     'Vienna, AT',      'office',     1200.00),
    (4, 'Stockholm Plant',         'Stockholm, SE',   'factory',    9500.00),
    (5, 'New York HQ',             'New York, USA',   'office',     3000.00);

-- App Users
INSERT INTO app_user (company_id, email, password_hash, full_name, role) VALUES
    (1, 'admin@ecocorp.de',         'hashed_pw_001', 'Klaus Müller',     'admin'),
    (1, 'sustainability@ecocorp.de','hashed_pw_002', 'Anna Schmidt',     'sustainability_manager'),
    (2, 'analyst@greentrade.nl',    'hashed_pw_003', 'Jan de Vries',     'analyst'),
    (3, 'supplier@solarsupply.at',  'hashed_pw_004', 'Eva Gruber',       'supplier'),
    (5, 'exec@cleanchain.com',      'hashed_pw_005', 'Michael Johnson',  'viewer');

-- Suppliers
INSERT INTO supplier (name, country, sustainability_rating, verified, last_submission_date) VALUES
    ('Green Logistics Ltd',    'Netherlands', 8.5, TRUE,  '2026-03-15'),
    ('FastFreight GmbH',       'Germany',     6.2, TRUE,  '2026-02-28'),
    ('EcoMaterials Co.',       'France',      9.1, TRUE,  '2026-03-01'),
    ('CheapShip Ltd',          'China',       3.4, FALSE, '2025-10-15'),
    ('Nordic Transport AS',    'Norway',      7.8, TRUE,  '2026-03-20'),
    ('SteelSource Inc.',       'USA',         5.5, FALSE, NULL);

-- Supplier Relationships
INSERT INTO supplier_relationship (company_id, supplier_id, since_date) VALUES
    (1, 1, '2020-01-15'),
    (1, 2, '2021-06-01'),
    (1, 4, '2022-03-10'),
    (2, 1, '2019-11-20'),
    (2, 5, '2021-02-28'),
    (4, 3, '2020-07-14'),
    (5, 6, '2023-01-01');

-- Regulatory Frameworks
INSERT INTO regulatory_framework (name, jurisdiction, target_year, description) VALUES
    ('GHG Protocol',        'Global',          2050, 'Greenhouse Gas Protocol corporate accounting standard'),
    ('EU CSRD',             'European Union',  2030, 'Corporate Sustainability Reporting Directive'),
    ('ISO 14064',           'Global',          2030, 'International GHG accounting and verification standard'),
    ('SEC Climate Rules',   'USA',             2030, 'SEC mandatory climate risk disclosure requirements'),
    ('UK SECR',             'United Kingdom',  2030, 'Streamlined Energy and Carbon Reporting framework');

-- Emission Activities (Scope 1, 2, 3 examples)
INSERT INTO emission_activity (facility_id, supplier_id, scope, category, activity_type, quantity, unit, emission_factor, co2e_kg, activity_date, recorded_by) VALUES
    -- Scope 1: Direct emissions from factory combustion
    (1, NULL, 1, 'Stationary Combustion', 'Natural Gas Boiler',        12000.0, 'cubic_meter', 2.0400, 24480.00, '2026-01-10', 2),
    (5, NULL, 1, 'Stationary Combustion', 'Diesel Generator',           3500.0, 'liter',       2.6800,  9380.00, '2026-01-15', 2),
    -- Scope 2: Purchased electricity
    (1, NULL, 2, 'Purchased Electricity', 'Grid Electricity',          85000.0, 'kWh',         0.4100, 34850.00, '2026-01-31', 2),
    (2, NULL, 2, 'Purchased Electricity', 'Grid Electricity',          32000.0, 'kWh',         0.4100, 13120.00, '2026-01-31', 3),
    (4, NULL, 2, 'Purchased Electricity', 'Renewable Grid',            14000.0, 'kWh',         0.0300,   420.00, '2026-01-31', 2),
    -- Scope 3: Supplier and freight emissions
    (1,    1, 3, 'Upstream Transport',   'Freight Transport Road',      500.0, 'tonne-km',    0.0960,    48.00, '2026-02-05', 2),
    (1,    2, 3, 'Upstream Transport',   'Freight Transport Air',        80.0, 'tonne-km',    0.6020,    48.16, '2026-02-10', 2),
    (1,    4, 3, 'Purchased Goods',      'Steel Procurement',          2000.0, 'tonne',        1.8500,  3700.00, '2026-02-15', 2),
    (2,    5, 3, 'Upstream Transport',   'Freight Transport Sea',      9500.0, 'tonne-km',    0.0160,   152.00, '2026-02-20', 3),
    (5,    3, 3, 'Purchased Goods',      'Packaging Materials',         800.0, 'tonne',        0.9200,   736.00, '2026-03-01', 2);

-- Shipments
INSERT INTO shipment (supplier_id, company_id, origin, destination, transport_mode, distance_km, weight_kg, fuel_liters, co2e_kg, shipment_date) VALUES
    (1, 1, 'Rotterdam, NL',   'Berlin, DE',    'road',  650.0,  18000.0, 420.0,  1128.96, '2026-01-20'),
    (2, 1, 'Frankfurt, DE',   'Berlin, DE',    'road',  550.0,  12000.0, 310.0,   831.20, '2026-02-03'),
    (4, 1, 'Shanghai, CN',    'Hamburg, DE',   'sea',  20200.0, 45000.0, 8200.0, 3459.20, '2026-02-10'),
    (5, 2, 'Oslo, NO',        'Rotterdam, NL', 'sea',  1200.0,  30000.0, 1100.0,  576.00, '2026-02-18'),
    (3, 4, 'Paris, FR',       'Stockholm, SE', 'road', 2100.0,   8000.0,  950.0, 2547.60, '2026-03-05'),
    (6, 5, 'Chicago, USA',    'New York, USA', 'road',  1300.0,  15000.0, 720.0, 1930.80, '2026-03-12'),
    (1, 1, 'Amsterdam, NL',   'Berlin, DE',    'rail',  680.0,  22000.0,    0.0,  329.44, '2026-03-20');

-- Carbon Offsets
INSERT INTO carbon_offset (company_id, project_name, certification, credits_purchased, credits_retired, purchase_date, vintage_year) VALUES
    (1, 'Amazon Rainforest REDD+',       'VCS',          500.0, 300.0, '2026-01-05', 2025),
    (1, 'Wind Farm Kenya',               'Gold Standard', 200.0, 200.0, '2026-02-01', 2025),
    (2, 'Solar Cookstoves Ghana',        'Gold Standard', 150.0,  50.0, '2026-02-15', 2025),
    (4, 'Nordic Reforestation Project',  'VCS',          100.0, 100.0, '2026-03-01', 2025),
    (5, 'Methane Capture Brazil',        'VCS',          300.0, 180.0, '2026-03-10', 2024);

-- Compliance Records
INSERT INTO compliance_record (company_id, framework_id, reporting_period, target_co2e, actual_co2e, status) VALUES
    (1, 1, '2025-Q4', 80000.0,  72000.0, 'compliant'),
    (1, 2, '2025-Q4', 75000.0,  72000.0, 'compliant'),
    (2, 1, '2025-Q4', 30000.0,  33500.0, 'non_compliant'),
    (3, 3, '2025-Q4', 10000.0,   9800.0, 'compliant'),
    (4, 2, '2025-Q4', 25000.0,  24100.0, 'compliant'),
    (5, 4, '2025-Q4', 20000.0,  21500.0, 'non_compliant');

-- Audit Log (sample entries)
INSERT INTO audit_log (user_id, action, table_name, record_id, old_value, new_value) VALUES
    (2, 'INSERT', 'emission_activity', 1,  NULL,                              'scope=1, co2e_kg=24480.00'),
    (2, 'UPDATE', 'emission_activity', 3,  'co2e_kg=30000.00',               'co2e_kg=34850.00'),
    (3, 'INSERT', 'shipment',          4,  NULL,                              'transport_mode=sea, co2e_kg=576.00'),
    (1, 'UPDATE', 'supplier',          4,  'sustainability_rating=3.4',       'sustainability_rating=3.4'),
    (2, 'INSERT', 'carbon_offset',     1,  NULL,                              'credits_purchased=500.0');

-- ============================================================
-- End of ecotrack_schema.sql
-- Full synthetic dataset (5,000+ records) is in ecotrack_data.sql
-- Generated using Python Faker library + IPCC AR6 emission factors
-- ============================================================

-- ============================================================
-- ANALYTICAL VIEWS (7 Advanced Queries)
-- ============================================================

-- Query 1: Monthly Emission Trend Analysis
CREATE OR REPLACE VIEW v_monthly_emission_trend AS
SELECT
  c.company_id,
  c.name AS company_name,
  DATE_TRUNC('month', ea.activity_date) AS month,
  ea.scope,
  SUM(ea.co2e_kg) AS total_co2e_kg,
  LAG(SUM(ea.co2e_kg)) OVER (
    PARTITION BY c.company_id, ea.scope
    ORDER BY DATE_TRUNC('month', ea.activity_date)
  ) AS prev_month_co2e
FROM emission_activity ea
JOIN facility f ON ea.facility_id = f.facility_id
JOIN company c ON f.company_id = c.company_id
GROUP BY c.company_id, c.name, DATE_TRUNC('month', ea.activity_date), ea.scope
ORDER BY c.name, month;

-- Query 2: Top Supplier Carbon Risk Ranking
CREATE OR REPLACE VIEW v_supplier_risk_ranking AS
SELECT
  s.supplier_id,
  s.name AS supplier_name,
  s.country,
  s.sustainability_rating,
  COALESCE(SUM(ea.co2e_kg), 0) AS total_scope3_co2e,
  RANK() OVER (ORDER BY COALESCE(SUM(ea.co2e_kg), 0) DESC) AS carbon_risk_rank
FROM supplier s
LEFT JOIN emission_activity ea ON ea.supplier_id = s.supplier_id AND ea.scope = 3
GROUP BY s.supplier_id, s.name, s.country, s.sustainability_rating
ORDER BY total_scope3_co2e DESC;

-- Query 3: Carbon Offset vs. Net Emission Balance
CREATE OR REPLACE VIEW v_offset_net_balance AS
SELECT
  c.company_id,
  c.name AS company_name,
  DATE_TRUNC('quarter', ea.activity_date) AS quarter,
  COALESCE(SUM(ea.co2e_kg), 0) AS gross_emissions_kg,
  COALESCE(SUM(co.credits_retired), 0) * 1000 AS offsets_kg,
  COALESCE(SUM(ea.co2e_kg), 0) - COALESCE(SUM(co.credits_retired), 0) * 1000 AS net_emissions_kg
FROM emission_activity ea
JOIN facility f ON ea.facility_id = f.facility_id
JOIN company c ON f.company_id = c.company_id
LEFT JOIN carbon_offset co
  ON co.company_id = c.company_id
  AND DATE_TRUNC('quarter', co.purchase_date) = DATE_TRUNC('quarter', ea.activity_date)
GROUP BY c.company_id, c.name, DATE_TRUNC('quarter', ea.activity_date)
ORDER BY c.name, quarter;

-- Query 4: Regulatory Compliance Status Report
CREATE OR REPLACE VIEW v_compliance_status AS
SELECT
  c.company_id,
  c.name AS company_name,
  rf.name AS framework,
  cr.reporting_period,
  cr.target_co2e,
  cr.actual_co2e,
  cr.status,
  ROUND((cr.actual_co2e / NULLIF(cr.target_co2e, 0) - 1) * 100, 2) AS over_target_pct
FROM compliance_record cr
JOIN company c ON cr.company_id = c.company_id
JOIN regulatory_framework rf ON cr.framework_id = rf.framework_id
ORDER BY cr.reporting_period DESC, over_target_pct DESC;

-- Query 5: Transport Mode Emission Comparison
CREATE OR REPLACE VIEW v_transport_mode_comparison AS
SELECT
  transport_mode,
  COUNT(*) AS shipment_count,
  SUM(co2e_kg) AS total_co2e_kg,
  ROUND(
    SUM(co2e_kg) / NULLIF(SUM(distance_km * weight_kg / 1000.0), 0),
    4
  ) AS co2e_per_tonne_km
FROM shipment
GROUP BY transport_mode
ORDER BY co2e_per_tonne_km DESC;

-- Query 6: Emission Intensity by Product Category / Supplier
CREATE OR REPLACE VIEW v_emission_intensity_by_supplier AS
SELECT
  s.supplier_id,
  s.name AS supplier_name,
  s.country,
  ea.category AS product_category,
  ea.activity_type,
  COUNT(*) AS activity_count,
  SUM(ea.co2e_kg) AS total_co2e_kg,
  ROUND(SUM(ea.co2e_kg) / NULLIF(COUNT(*), 0), 4) AS co2e_per_unit
FROM supplier s
JOIN emission_activity ea ON ea.supplier_id = s.supplier_id
GROUP BY s.supplier_id, s.name, s.country, ea.category, ea.activity_type
ORDER BY total_co2e_kg DESC;

-- Query 7: Supplier Emission Verification Lag
CREATE OR REPLACE VIEW v_supplier_verification_lag AS
SELECT
  s.supplier_id,
  s.name AS supplier_name,
  s.country,
  s.sustainability_rating,
  s.verified,
  s.last_submission_date,
  CURRENT_DATE - s.last_submission_date AS days_since_submission,
  CASE
    WHEN s.last_submission_date IS NULL           THEN 'Never submitted'
    WHEN CURRENT_DATE - s.last_submission_date > 90 THEN 'Overdue (>90 days)'
    WHEN CURRENT_DATE - s.last_submission_date > 30 THEN 'Late (>30 days)'
    ELSE 'Recent'
  END AS submission_status
FROM supplier s
WHERE s.verified = FALSE
   OR s.last_submission_date IS NULL
   OR (CURRENT_DATE - s.last_submission_date) > 30
ORDER BY days_since_submission DESC NULLS FIRST;
