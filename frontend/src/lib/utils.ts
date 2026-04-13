import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Retorna as iniciais de um nome (ex: "João Silva" → "JS") */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/** Formata uma data ISO para "dd/mm/aaaa" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Formata uma data ISO para "Hoje às HH:mm", "Ontem..." ou "dd/mm/aaaa" */
export function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Hoje às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return formatDate(iso);
}

// Paleta de cores predefinida para boards
export const BOARD_COLORS = [
  "#4f46e5",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

const COLORS_KEY = "mob_board_colors";

/** Recupera o mapa boardId → cor do localStorage */
function loadColorMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(COLORS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Persiste o mapa de cores */
function saveColorMap(map: Record<string, string>) {
  localStorage.setItem(COLORS_KEY, JSON.stringify(map));
}

/** Retorna a cor de um board (ou atribui uma aleatória se não houver) */
export function getBoardColor(id: string): string {
  const map = loadColorMap();
  if (!map[id]) {
    const idx = Object.keys(map).length % BOARD_COLORS.length;
    map[id] = BOARD_COLORS[idx];
    saveColorMap(map);
  }
  return map[id];
}

/** Define manualmente a cor de um board */
export function setBoardColor(id: string, color: string) {
  const map = loadColorMap();
  map[id] = color;
  saveColorMap(map);
}
