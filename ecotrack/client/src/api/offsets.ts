import api from "./client";
import type { CarbonOffset, OffsetNetBalance } from "../types";

export const getOffsets = (company_id?: number) =>
  api
    .get<CarbonOffset[]>("/offsets", {
      params: company_id ? { company_id } : {},
    })
    .then((r) => r.data);

export const getOffsetBalance = (company_id?: number) =>
  api
    .get<OffsetNetBalance[]>("/offsets/balance", {
      params: company_id ? { company_id } : {},
    })
    .then((r) => r.data);

export const createOffset = (data: Partial<CarbonOffset>) =>
  api.post<CarbonOffset>("/offsets", data).then((r) => r.data);

export const deleteOffset = (id: number) =>
  api.delete(`/offsets/${id}`).then((r) => r.data);
