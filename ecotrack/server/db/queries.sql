-- ============================================================
-- EcoTrack — 7 Advanced SQL Queries (as VIEWs)
-- ============================================================

-- Query 1: Monthly Emission Trend (with LAG window function)
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
GROUP BY c.company_id, c.name, month, ea.scope
ORDER BY c.name, month;

-- Query 2: Top Supplier Carbon Risk Ranking
CREATE OR REPLACE VIEW v_supplier_risk_ranking AS
SELECT
  s.supplier_id,
  s.name AS supplier_name,
  s.country,
  s.sustainability_rating,
  SUM(ea.co2e_kg) AS total_scope3_co2e,
  RANK() OVER (ORDER BY SUM(ea.co2e_kg) DESC) AS carbon_risk_rank
FROM emission_activity ea
JOIN supplier s ON ea.supplier_id = s.supplier_id
WHERE ea.scope = 3
GROUP BY s.supplier_id, s.name, s.country, s.sustainability_rating
ORDER BY total_scope3_co2e DESC;

-- Query 3: Carbon Offset Net Balance per Quarter
CREATE OR REPLACE VIEW v_offset_net_balance AS
SELECT
  c.company_id,
  c.name AS company_name,
  DATE_TRUNC('quarter', ea.activity_date) AS quarter,
  SUM(ea.co2e_kg) AS gross_emissions_kg,
  COALESCE(SUM(co.credits_retired), 0) * 1000 AS offsets_kg,
  SUM(ea.co2e_kg) - COALESCE(SUM(co.credits_retired), 0) * 1000 AS net_emissions_kg
FROM emission_activity ea
JOIN facility f ON ea.facility_id = f.facility_id
JOIN company c ON f.company_id = c.company_id
LEFT JOIN carbon_offset co
  ON co.company_id = c.company_id
  AND DATE_TRUNC('quarter', co.purchase_date) = DATE_TRUNC('quarter', ea.activity_date)
GROUP BY c.company_id, c.name, quarter
ORDER BY c.name, quarter;

-- Query 4: Regulatory Compliance Status
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
  sh.transport_mode,
  COUNT(*) AS shipment_count,
  SUM(sh.co2e_kg) AS total_co2e_kg,
  ROUND(
    SUM(sh.co2e_kg) / NULLIF(SUM(sh.distance_km * sh.weight_kg / 1000), 0),
    4
  ) AS co2e_per_tonne_km
FROM shipment sh
GROUP BY sh.transport_mode
ORDER BY co2e_per_tonne_km DESC;

-- Query 6: Emission Intensity by Supplier
CREATE OR REPLACE VIEW v_emission_intensity_by_supplier AS
SELECT
  s.supplier_id,
  s.name AS supplier_name,
  ea.activity_type,
  COUNT(*) AS activity_count,
  SUM(ea.co2e_kg) AS total_co2e_kg,
  ROUND(AVG(ea.co2e_kg), 2) AS avg_co2e_per_activity
FROM emission_activity ea
JOIN supplier s ON ea.supplier_id = s.supplier_id
WHERE ea.scope = 3
GROUP BY s.supplier_id, s.name, ea.activity_type
ORDER BY total_co2e_kg DESC;

-- Query 7: Supplier Verification Lag
CREATE OR REPLACE VIEW v_supplier_verification_lag AS
SELECT
  s.supplier_id,
  s.name,
  s.country,
  s.verified,
  s.last_submission_date,
  CURRENT_DATE - s.last_submission_date AS days_since_submission,
  CASE
    WHEN s.last_submission_date IS NULL THEN 'Never submitted'
    WHEN CURRENT_DATE - s.last_submission_date > 90 THEN 'Overdue'
    WHEN CURRENT_DATE - s.last_submission_date > 30 THEN 'Late'
    ELSE 'On track'
  END AS submission_status
FROM supplier s
WHERE s.verified = FALSE
   OR s.last_submission_date IS NULL
   OR CURRENT_DATE - s.last_submission_date > 30
ORDER BY days_since_submission DESC NULLS FIRST;
