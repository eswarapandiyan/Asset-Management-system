// src/utils/api.ts
import { toast } from "sonner";

const BASE_URL = "http://localhost:5050"; // move to .env if needed

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ApiOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
}

export async function apiRequest(
  endpoint: string,
  { method = "GET", body, headers = {} }: ApiOptions = {}
) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle unauthorized responses
    if (response.status === 401) {
      toast.error("Unauthorized! Please log in again.");
      localStorage.removeItem("token");
      window.location.href = "/login"; // fallback redirect
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      toast.error(errorData.message || "API Error");
      throw new Error(errorData.message || "API Error");
    }

    return await response.json();
  } catch (error) {
    console.error("API Request Error:", error);
    toast.error("Network/server error. Please try again later.");
    throw error;
  }
}
