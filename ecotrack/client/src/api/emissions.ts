import api from "./client";
import type {
  EmissionActivity,
  MonthlyEmissionTrend,
  PaginatedResponse,
} from "../types";

export interface EmissionFilters {
  company_id?: number;
  scope?: 1 | 2 | 3;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export const getEmissions = (filters: EmissionFilters = {}) =>
  api
    .get<PaginatedResponse<EmissionActivity>>("/emissions", { params: filters })
    .then((r) => r.data);

export const createEmission = (data: Partial<EmissionActivity>) =>
  api.post<EmissionActivity>("/emissions", data).then((r) => r.data);

export const approveEmission = (id: number) =>
  api.patch<EmissionActivity>(`/emissions/${id}/approve`).then((r) => r.data);

export const rejectEmission = (id: number) =>
  api.patch<EmissionActivity>(`/emissions/${id}/reject`).then((r) => r.data);

export const deleteEmission = (id: number) =>
  api.delete(`/emissions/${id}`).then((r) => r.data);

export const getEmissionTrends = (company_id?: number) =>
  api
    .get<MonthlyEmissionTrend[]>("/emissions/trends", {
      params: company_id ? { company_id } : {},
    })
    .then((r) => r.data);
