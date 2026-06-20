import { Company } from "@/type";

const BACKEND_ENDPOINT = process.env.NEXT_PUBLIC_SERVER_ENDPOINT;

export interface RegisterPayload {
  email: string;
  password?: string;
  fullCompanyName: string;
  companySerialNumber: string;
  address: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Company;
  token?: string;
}

const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export const registerUser = async (
  payload: RegisterPayload,
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${BACKEND_ENDPOINT}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Registration failed.",
      };
    }

    return {
      success: true,
      message: "Registration successful!",
      user: data.user,
    };
  } catch (error) {
    console.error("Service Registration Error:", error);
    return { success: false, message: "Network or server error occurred." };
  }
};

export const loginUser = async (
  payload: LoginPayload,
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${BACKEND_ENDPOINT}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Invalid credentials.",
      };
    }

    return {
      success: true,
      message: "Login successful!",
      user: data.user,
      token: data.token,
    };
  } catch (error) {
    console.error("Service Login Error:", error);
    return { success: false, message: "Network or server error occurred." };
  }
};

export const checkAuthStatus = async (
  validateWithBackend = false,
): Promise<AuthResponse> => {
  try {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || getCookie("token")
        : null;

    if (!token) {
      return { success: false, message: "No authentication token found." };
    }

    if (!validateWithBackend) {
      return { success: true, message: "Token exists locally.", token };
    }

    const response = await fetch(`${BACKEND_ENDPOINT}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Session expired or invalid.",
      };
    }

    return {
      success: true,
      message: "Authenticated successfully.",
      user: data.user,
      token,
    };
  } catch (error) {
    console.error("Service Auth Check Error:", error);
    return {
      success: false,
      message: "Error validating authentication status.",
    };
  }
};
