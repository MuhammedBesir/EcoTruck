import api from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  company_id: number;
  role: "admin" | "manager" | "analyst" | "supplier" | "viewer";
}

export interface AuthResponse {
  token: string;
  user: {
    user_id: number;
    company_id: number;
    email: string;
    role: string;
    full_name: string;
    company_name: string;
    created_at: string;
  };
}

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),

  register: (data: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", data).then((r) => r.data),

  me: () => api.get<AuthResponse>("/auth/me").then((r) => r.data),

  changePassword: (current_password: string, new_password: string) =>
    api
      .post("/auth/change-password", { current_password, new_password })
      .then((r) => r.data),
};
