// ============================================================
// EcoTrack — TypeScript Interfaces for all 11 DB entities
// ============================================================

export interface Company {
  company_id: number;
  name: string;
  industry: string | null;
  country: string;
  tax_id: string | null;
  founded_year: number | null;
  facility_count?: number;
  user_count?: number;
}

export interface Facility {
  facility_id: number;
  company_id: number;
  name: string;
  location: string | null;
  facility_type: "warehouse" | "factory" | "office" | "port" | "farm" | null;
  size_sqm: number | null;
}

export interface AppUser {
  user_id: number;
  company_id: number;
  company_name?: string;
  email: string;
  role: "admin" | "manager" | "analyst" | "supplier" | "viewer";
  full_name: string;
  created_at: string;
}

export interface Supplier {
  supplier_id: number;
  name: string;
  country: string | null;
  sustainability_rating: number | null;
  verified: boolean;
  last_submission_date: string | null;
  total_scope3_co2e?: number;
}

export interface SupplierRelationship {
  company_id: number;
  supplier_id: number;
  since_date: string | null;
}

export interface EmissionActivity {
  activity_id: number;
  facility_id: number | null;
  supplier_id: number | null;
  recorded_by: number | null;
  scope: 1 | 2 | 3;
  activity_type: string | null;
  co2e_kg: number;
  activity_date: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  approved_by: number | null;
  approved_at: string | null;
  facility_name?: string;
  company_name?: string;
  supplier_name?: string;
  recorded_by_name?: string;
  approved_by_name?: string;
}

export interface Shipment {
  shipment_id: number;
  supplier_id: number | null;
  company_id: number | null;
  transport_mode: "road" | "sea" | "air" | "rail" | "inland_waterway" | null;
  distance_km: number | null;
  weight_kg: number | null;
  co2e_kg: number | null;
  shipment_date: string;
  supplier_name?: string;
  company_name?: string;
}

export interface CarbonOffset {
  offset_id: number;
  company_id: number;
  project_name: string | null;
  certification_body: string | null;
  credits_purchased: number | null;
  credits_retired: number;
  purchase_date: string;
  company_name?: string;
}

export interface RegulatoryFramework {
  framework_id: number;
  name: string;
  jurisdiction: string | null;
  target_year: number | null;
}

export interface ComplianceRecord {
  record_id: number;
  company_id: number;
  framework_id: number;
  reporting_period: string | null;
  target_co2e: number | null;
  actual_co2e: number | null;
  status: "compliant" | "non_compliant" | "pending" | null;
  company_name?: string;
  framework?: string;
  over_target_pct?: number;
}

export interface AuditLog {
  log_id: number;
  user_id: number | null;
  action: string;
  table_name: string | null;
  record_id: number | null;
  timestamp: string;
  details: Record<string, unknown> | null;
  user_name?: string;
}

// Query result types
export interface MonthlyEmissionTrend {
  company_id: number;
  company_name: string;
  month: string;
  scope: 1 | 2 | 3;
  total_co2e_kg: number;
  prev_month_co2e: number | null;
}

export interface SupplierRiskRanking {
  supplier_id: number;
  supplier_name: string;
  country: string | null;
  sustainability_rating: number | null;
  total_scope3_co2e: number;
  carbon_risk_rank: number;
}

export interface OffsetNetBalance {
  company_id: number;
  company_name: string;
  quarter: string;
  gross_emissions_kg: number;
  offsets_kg: number;
  net_emissions_kg: number;
}

export interface TransportComparison {
  transport_mode: string;
  shipment_count: number;
  total_co2e_kg: number;
  co2e_per_tonne_km: number;
}

export interface SupplierVerificationLag {
  supplier_id: number;
  name: string;
  country: string | null;
  verified: boolean;
  last_submission_date: string | null;
  days_since_submission: number | null;
  submission_status: "Never submitted" | "Overdue" | "Late" | "On track";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
