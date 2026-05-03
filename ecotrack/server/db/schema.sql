-- ============================================================
-- EcoTrack: Supply Chain Carbon Management System
-- Database Schema (PostgreSQL 15)
-- ============================================================

-- 1. company
CREATE TABLE company (
  company_id    SERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  industry      VARCHAR(100),
  country       VARCHAR(100) NOT NULL,
  tax_id        VARCHAR(50) UNIQUE,
  founded_year  INT CHECK (founded_year > 1800)
);

-- 2. facility
CREATE TABLE facility (
  facility_id   SERIAL PRIMARY KEY,
  company_id    INT NOT NULL REFERENCES company(company_id) ON DELETE CASCADE,
  name          VARCHAR(200) NOT NULL,
  location      VARCHAR(200),
  facility_type VARCHAR(50) CHECK (facility_type IN ('warehouse','factory','office','port','farm')),
  size_sqm      NUMERIC(12,2)
);

-- 3. app_user
CREATE TABLE app_user (
  user_id       SERIAL PRIMARY KEY,
  company_id    INT NOT NULL REFERENCES company(company_id) ON DELETE CASCADE,
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50) CHECK (role IN ('admin','manager','analyst','supplier','viewer')),
  full_name     VARCHAR(200) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. supplier
CREATE TABLE supplier (
  supplier_id           SERIAL PRIMARY KEY,
  name                  VARCHAR(200) NOT NULL,
  country               VARCHAR(100),
  sustainability_rating NUMERIC(3,1) CHECK (sustainability_rating BETWEEN 0 AND 10),
  verified              BOOLEAN DEFAULT FALSE,
  last_submission_date  DATE
);

-- 5. supplier_relationship (M:N junction)
CREATE TABLE supplier_relationship (
  company_id  INT NOT NULL REFERENCES company(company_id) ON DELETE CASCADE,
  supplier_id INT NOT NULL REFERENCES supplier(supplier_id) ON DELETE CASCADE,
  since_date  DATE,
  PRIMARY KEY (company_id, supplier_id)
);

-- 6. emission_activity
CREATE TABLE emission_activity (
  activity_id   SERIAL PRIMARY KEY,
  facility_id   INT REFERENCES facility(facility_id),
  supplier_id   INT REFERENCES supplier(supplier_id),
  recorded_by   INT REFERENCES app_user(user_id),
  scope         SMALLINT NOT NULL CHECK (scope IN (1,2,3)),
  activity_type VARCHAR(100),
  co2e_kg       NUMERIC(16,4) NOT NULL,
  activity_date DATE NOT NULL,
  notes         TEXT,
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by   INT REFERENCES app_user(user_id),
  approved_at   TIMESTAMPTZ
);

-- 7. shipment
CREATE TABLE shipment (
  shipment_id    SERIAL PRIMARY KEY,
  supplier_id    INT REFERENCES supplier(supplier_id),
  company_id     INT REFERENCES company(company_id),
  transport_mode VARCHAR(30) CHECK (transport_mode IN ('road','sea','air','rail','inland_waterway')),
  distance_km    NUMERIC(10,2),
  weight_kg      NUMERIC(14,2),
  co2e_kg        NUMERIC(16,4),
  shipment_date  DATE NOT NULL
);

-- 8. carbon_offset
CREATE TABLE carbon_offset (
  offset_id          SERIAL PRIMARY KEY,
  company_id         INT NOT NULL REFERENCES company(company_id),
  project_name       VARCHAR(200),
  certification_body VARCHAR(100),
  credits_purchased  NUMERIC(14,4),
  credits_retired    NUMERIC(14,4) DEFAULT 0,
  purchase_date      DATE NOT NULL
);

-- 9. regulatory_framework
CREATE TABLE regulatory_framework (
  framework_id  SERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  jurisdiction  VARCHAR(100),
  target_year   INT
);

-- 10. compliance_record
CREATE TABLE compliance_record (
  record_id        SERIAL PRIMARY KEY,
  company_id       INT NOT NULL REFERENCES company(company_id),
  framework_id     INT NOT NULL REFERENCES regulatory_framework(framework_id),
  reporting_period VARCHAR(20),
  target_co2e      NUMERIC(18,4),
  actual_co2e      NUMERIC(18,4),
  status           VARCHAR(30) CHECK (status IN ('compliant','non_compliant','pending'))
);

-- 11. audit_log
CREATE TABLE audit_log (
  log_id     SERIAL PRIMARY KEY,
  user_id    INT REFERENCES app_user(user_id),
  action     VARCHAR(50) NOT NULL,
  table_name VARCHAR(100),
  record_id  INT,
  timestamp  TIMESTAMPTZ DEFAULT NOW(),
  details    JSONB
);

-- ============================================================
-- ANALYTICAL VIEWS (7 Advanced Queries from Progress Report)
-- ============================================================

-- Query 1: Monthly Emission Trend Analysis
CREATE OR REPLACE VIEW v_monthly_emission_trend AS
SELECT
  c.company_id,
  c.name AS company_name,
  DATE_TRUNC('month', ea.activity_date) AS month,
  SUM(ea.co2e_kg) AS total_co2e,
  LAG(SUM(ea.co2e_kg)) OVER (PARTITION BY c.company_id ORDER BY DATE_TRUNC('month', ea.activity_date)) AS prev_month_co2e,
  ROUND(
    (SUM(ea.co2e_kg) - LAG(SUM(ea.co2e_kg)) OVER (PARTITION BY c.company_id ORDER BY DATE_TRUNC('month', ea.activity_date)))
    / NULLIF(LAG(SUM(ea.co2e_kg)) OVER (PARTITION BY c.company_id ORDER BY DATE_TRUNC('month', ea.activity_date)), 0) * 100,
    2
  ) AS mom_change_pct
FROM emission_activity ea
JOIN facility f ON ea.facility_id = f.facility_id
JOIN company c ON f.company_id = c.company_id
GROUP BY c.company_id, c.name, DATE_TRUNC('month', ea.activity_date);

-- Query 2: Top Supplier Carbon Risk Ranking
CREATE OR REPLACE VIEW v_supplier_risk_ranking AS
SELECT
  s.supplier_id,
  s.name AS supplier_name,
  s.country,
  s.sustainability_rating,
  s.verified,
  COALESCE(SUM(ea.co2e_kg), 0) AS total_scope3_co2e,
  RANK() OVER (ORDER BY COALESCE(SUM(ea.co2e_kg), 0) DESC) AS risk_rank
FROM supplier s
LEFT JOIN emission_activity ea ON ea.supplier_id = s.supplier_id AND ea.scope = 3
GROUP BY s.supplier_id, s.name, s.country, s.sustainability_rating, s.verified;

-- Query 3: Carbon Offset vs. Net Emission Balance
CREATE OR REPLACE VIEW v_offset_net_balance AS
SELECT
  c.company_id,
  c.name AS company_name,
  DATE_TRUNC('quarter', ea.activity_date) AS quarter,
  COALESCE(SUM(ea.co2e_kg), 0) AS gross_emissions_co2e,
  COALESCE(SUM(co.credits_retired), 0) AS retired_credits,
  COALESCE(SUM(ea.co2e_kg), 0) - COALESCE(SUM(co.credits_retired), 0) AS net_co2e
FROM company c
LEFT JOIN facility f ON f.company_id = c.company_id
LEFT JOIN emission_activity ea ON ea.facility_id = f.facility_id
LEFT JOIN carbon_offset co ON co.company_id = c.company_id
  AND DATE_TRUNC('quarter', co.purchase_date) = DATE_TRUNC('quarter', ea.activity_date)
GROUP BY c.company_id, c.name, DATE_TRUNC('quarter', ea.activity_date);

-- Query 4: Regulatory Compliance Status Report
CREATE OR REPLACE VIEW v_compliance_status AS
SELECT
  cr.record_id,
  c.company_id,
  c.name AS company_name,
  rf.name AS framework_name,
  rf.jurisdiction,
  rf.target_year,
  cr.reporting_period,
  cr.target_co2e,
  cr.actual_co2e,
  cr.status,
  ROUND(
    CASE WHEN cr.target_co2e > 0
      THEN (cr.actual_co2e - cr.target_co2e) / cr.target_co2e * 100
      ELSE NULL
    END, 2
  ) AS over_target_pct
FROM compliance_record cr
JOIN company c ON cr.company_id = c.company_id
JOIN regulatory_framework rf ON cr.framework_id = rf.framework_id;

-- Query 5: Transport Mode Emission Comparison
CREATE OR REPLACE VIEW v_transport_mode_comparison AS
SELECT
  transport_mode,
  COUNT(*) AS shipment_count,
  SUM(co2e_kg) AS total_co2e,
  SUM(distance_km * weight_kg / 1000.0) AS total_tonne_km,
  ROUND(
    SUM(co2e_kg) / NULLIF(SUM(distance_km * weight_kg / 1000.0), 0),
    6
  ) AS co2e_per_tonne_km
FROM shipment
WHERE distance_km > 0 AND weight_kg > 0
GROUP BY transport_mode;

-- Query 6: Emission Intensity by Product Category / Supplier
CREATE OR REPLACE VIEW v_emission_intensity_by_supplier AS
SELECT
  s.supplier_id,
  s.name AS supplier_name,
  s.country,
  ea.activity_type AS product_category,
  COUNT(*) AS activity_count,
  SUM(ea.co2e_kg) AS total_co2e,
  ROUND(SUM(ea.co2e_kg) / NULLIF(COUNT(*), 0), 4) AS co2e_per_unit
FROM supplier s
JOIN emission_activity ea ON ea.supplier_id = s.supplier_id
GROUP BY s.supplier_id, s.name, s.country, ea.activity_type;

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
    WHEN s.last_submission_date IS NULL THEN 'Never submitted'
    WHEN CURRENT_DATE - s.last_submission_date > 90 THEN 'Overdue (>90 days)'
    WHEN CURRENT_DATE - s.last_submission_date > 30 THEN 'Late (>30 days)'
    ELSE 'Recent'
  END AS submission_status
FROM supplier s
WHERE s.verified = FALSE OR s.last_submission_date IS NULL
   OR (CURRENT_DATE - s.last_submission_date) > 30
ORDER BY days_since_submission DESC NULLS FIRST;
