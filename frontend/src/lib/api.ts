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
  bio: string | null;
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

export interface Column {
  id: string;
  title: string;
  position: number;
  board_id: string;
  created_at: string;
  updated_at: string;
}

export type Priority = "low" | "medium" | "high";

export interface Member {
  id: string;
  name: string;
  email: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  board_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  due_date: string | null;
  position: number;
  column_id: string;
  labels: Label[];
  assignee: Member | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWithContext extends Task {
  board_id: string;
  board_title: string;
  column_title: string;
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
  updateProfile(data: { name?: string; email?: string; bio?: string | null }) {
    return request<User>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  changePassword(data: { current_password: string; new_password: string }) {
    return request<void>("/auth/me/password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// ─── Boards ───────────────────────────────────────────────────────────────────

export const boardsApi = {
  list() {
    return request<Board[]>("/boards");
  },
  get(id: string) {
    return request<Board>(`/boards/${id}`);
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

// ─── Columns ──────────────────────────────────────────────────────────────────

export const columnsApi = {
  list(boardId: string) {
    return request<Column[]>(`/boards/${boardId}/columns`);
  },
  create(boardId: string, data: { title: string }) {
    return request<Column>(`/boards/${boardId}/columns`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update(columnId: string, data: { title: string }) {
    return request<Column>(`/columns/${columnId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  remove(columnId: string) {
    return request<void>(`/columns/${columnId}`, { method: "DELETE" });
  },
  reorder(boardId: string, columns: { id: string; position: number }[]) {
    return request<Column[]>(`/boards/${boardId}/columns/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ columns }),
    });
  },
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const tasksApi = {
  mine() {
    return request<TaskWithContext[]>("/tasks/mine");
  },
  listByBoard(boardId: string) {
    return request<Task[]>(`/boards/${boardId}/tasks`);
  },
  create(
    columnId: string,
    data: {
      title: string;
      description?: string;
      priority?: Priority;
      due_date?: string | null;
      label_ids?: string[];
      assignee_id?: string | null;
    }
  ) {
    return request<Task>(`/columns/${columnId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update(
    taskId: string,
    data: {
      title?: string;
      description?: string | null;
      priority?: Priority;
      due_date?: string | null;
      label_ids?: string[];
      assignee_id?: string | null;
    }
  ) {
    return request<Task>(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  move(taskId: string, data: { column_id: string; position: number }) {
    return request<Task>(`/tasks/${taskId}/move`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  remove(taskId: string) {
    return request<void>(`/tasks/${taskId}`, { method: "DELETE" });
  },
};

// ─── Members ──────────────────────────────────────────────────────────────────

export const membersApi = {
  list(boardId: string) {
    return request<Member[]>(`/boards/${boardId}/members`);
  },
  add(boardId: string, email: string) {
    return request<Member>(`/boards/${boardId}/members`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  remove(boardId: string, userId: string) {
    return request<void>(`/boards/${boardId}/members/${userId}`, { method: "DELETE" });
  },
};

// ─── Labels ───────────────────────────────────────────────────────────────────

export const labelsApi = {
  list(boardId: string) {
    return request<Label[]>(`/boards/${boardId}/labels`);
  },
  create(boardId: string, data: { name: string; color?: string }) {
    return request<Label>(`/boards/${boardId}/labels`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update(labelId: string, data: { name?: string; color?: string }) {
    return request<Label>(`/labels/${labelId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  remove(labelId: string) {
    return request<void>(`/labels/${labelId}`, { method: "DELETE" });
  },
};

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  task_id: string | null;
  created_at: string;
}

export const notificationsApi = {
  list() {
    return request<Notification[]>("/notifications");
  },
  markAllRead() {
    return request<void>("/notifications/read-all", { method: "POST" });
  },
};
