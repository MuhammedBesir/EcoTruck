import api from "./client";
import type {
  Supplier,
  SupplierRiskRanking,
  SupplierVerificationLag,
} from "../types";

export interface SupplierFilters {
  company_id?: number;
  country?: string;
  min_rating?: number;
  max_rating?: number;
  verified?: boolean;
  search?: string;
}

export const getSuppliers = (filters: SupplierFilters = {}) =>
  api.get<Supplier[]>("/suppliers", { params: filters }).then((r) => r.data);

export const getSupplier = (id: number) =>
  api.get<Supplier>(`/suppliers/${id}`).then((r) => r.data);

export const getSupplierRiskRanking = (company_id?: number) =>
  api
    .get<SupplierRiskRanking[]>("/suppliers/risk-ranking", {
      params: company_id ? { company_id } : undefined,
    })
    .then((r) => r.data);

export const getVerificationLag = (company_id?: number) =>
  api
    .get<SupplierVerificationLag[]>("/suppliers/verification-lag", {
      params: company_id ? { company_id } : undefined,
    })
    .then((r) => r.data);
