const BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("mob_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const data = await res.json();
      message = data.detail ?? message;
    } catch {
      // mantém a mensagem padrão
    }
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Board {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register(data: { name: string; email: string; password: string }) {
    return request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  login(data: { email: string; password: string }) {
    return request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  me() {
    return request<User>("/auth/me");
  },
};

// ─── Boards ───────────────────────────────────────────────────────────────────

export const boardsApi = {
  list() {
    return request<Board[]>("/boards");
  },
  create(data: { title: string; description?: string }) {
    return request<Board>("/boards", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update(id: string, data: { title?: string; description?: string }) {
    return request<Board>(`/boards/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  remove(id: string) {
    return request<void>(`/boards/${id}`, { method: "DELETE" });
  },
};
