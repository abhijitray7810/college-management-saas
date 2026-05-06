import { api } from "./api";
import type { Role, User } from "@/types";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  async getCurrentUser(): Promise<AuthResponse["data"]["user"]> {
    const response = await api.get("/auth/me");
    return response.data.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
};
