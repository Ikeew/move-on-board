import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  CheckSquare,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  Clock,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { tasksApi, type TaskWithContext, type Priority } from "../lib/api";
import { formatDate } from "../lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const PRIORITY_COLOR: Record<Priority, string> = {
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

function isOverdue(due_date: string | null): boolean {
  if (!due_date) return false;
  return new Date(due_date) < new Date();
}

function isDueSoon(due_date: string | null): boolean {
  if (!due_date) return false;
  const diff = new Date(due_date).getTime() - Date.now();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 dias
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

function TaskRow({ task }: { task: TaskWithContext }) {
  const overdue = isOverdue(task.due_date);
  const soon = isDueSoon(task.due_date);

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700
                    bg-white dark:bg-slate-800 hover:shadow-md transition-all group">
      {/* Indicador de prioridade */}
      <div className={`mt-0.5 size-2 rounded-full shrink-0 ${
        task.priority === "high" ? "bg-red-400" :
        task.priority === "medium" ? "bg-amber-400" : "bg-emerald-400"
      }`} />

      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm
                      font-['Plus_Jakarta_Sans',sans-serif] leading-snug mb-1">
          {task.title}
        </p>

        {/* Breadcrumb: quadro → lista */}
        <Link
          to={`/projetos/${task.board_id}`}
          className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500
                     hover:text-[#4f46e5] dark:hover:text-indigo-400 transition-colors
                     font-['Plus_Jakarta_Sans',sans-serif]"
        >
          {task.board_title}
          <span className="text-slate-300 dark:text-slate-600">›</span>
          {task.column_title}
          <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Labels */}
        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.labels.map((l) => (
              <span
                key={l.id}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: l.color }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lado direito */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority]}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>

        {task.due_date && (
          <span className={`flex items-center gap-1 text-xs font-medium font-['Plus_Jakarta_Sans',sans-serif]
                            ${overdue ? "text-red-500 dark:text-red-400" :
                              soon ? "text-amber-500 dark:text-amber-400" :
                              "text-slate-400 dark:text-slate-500"}`}>
            {overdue ? <AlertCircle size={12} /> : soon ? <Clock size={12} /> : <Calendar size={12} />}
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

type FilterPriority = "all" | Priority;
type FilterDate = "all" | "overdue" | "soon" | "no_date";

export function MinhasTarefas() {
  const [tasks, setTasks] = useState<TaskWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterDate, setFilterDate] = useState<FilterDate>("all");

  useEffect(() => {
    tasksApi
      .mine()
      .then(setTasks)
      .catch(() => toast.error("Erro ao carregar tarefas"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter((t) => {
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterDate === "overdue" && !isOverdue(t.due_date)) return false;
    if (filterDate === "soon" && !isDueSoon(t.due_date)) return false;
    if (filterDate === "no_date" && t.due_date !== null) return false;
    return true;
  });

  // Agrupa por quadro
  const grouped = filtered.reduce<Record<string, { boardTitle: string; boardId: string; tasks: TaskWithContext[] }>>(
    (acc, t) => {
      if (!acc[t.board_id]) {
        acc[t.board_id] = { boardTitle: t.board_title, boardId: t.board_id, tasks: [] };
      }
      acc[t.board_id].tasks.push(t);
      return acc;
    },
    {}
  );

  // Stats
  const overdue = tasks.filter((t) => isOverdue(t.due_date)).length;
  const soon = tasks.filter((t) => isDueSoon(t.due_date)).length;
  const high = tasks.filter((t) => t.priority === "high").length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-10 rounded-full border-4 border-[#4f46e5] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-3xl text-slate-900 dark:text-slate-100 mb-1">
          Minhas Tarefas
        </h1>
        <p className="font-['Plus_Jakarta_Sans',sans-serif] text-slate-500 dark:text-slate-400">
          Tarefas atribuídas a você em todos os quadros
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard value={tasks.length} label="Total" color="bg-indigo-50 dark:bg-indigo-900/30" dot="bg-[#4f46e5]" />
        <StatCard value={high} label="Alta prioridade" color="bg-red-50 dark:bg-red-900/30" dot="bg-red-400" />
        <StatCard value={overdue} label="Atrasadas" color="bg-rose-50 dark:bg-rose-900/30" dot="bg-rose-500" />
        <StatCard value={soon} label="Vencem em breve" color="bg-amber-50 dark:bg-amber-900/30" dot="bg-amber-400" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Filter size={15} />
          <span className="text-sm font-medium font-['Plus_Jakarta_Sans',sans-serif]">Filtrar:</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["all", "low", "medium", "high"] as FilterPriority[]).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold font-['Plus_Jakarta_Sans',sans-serif] transition-all
                          ${filterPriority === p
                            ? "bg-[#4f46e5] text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"}`}
            >
              {p === "all" ? "Todas" : PRIORITY_LABEL[p as Priority]}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 hidden sm:block" />

        <div className="flex gap-2 flex-wrap">
          {([
            { id: "all", label: "Qualquer data" },
            { id: "overdue", label: "Atrasadas" },
            { id: "soon", label: "Vencendo em breve" },
            { id: "no_date", label: "Sem prazo" },
          ] as { id: FilterDate; label: string }[]).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterDate(f.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold font-['Plus_Jakarta_Sans',sans-serif] transition-all
                          ${filterDate === f.id
                            ? "bg-[#4f46e5] text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista agrupada */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
            <CheckSquare size={32} className="text-[#4f46e5]" />
          </div>
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">
            {tasks.length === 0 ? "Nenhuma tarefa atribuída" : "Nenhuma tarefa com esses filtros"}
          </h3>
          <p className="font-['Plus_Jakarta_Sans',sans-serif] text-slate-500 dark:text-slate-400 text-sm max-w-xs">
            {tasks.length === 0
              ? "Quando alguém atribuir uma tarefa a você, ela aparecerá aqui."
              : "Tente ajustar os filtros acima."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.values(grouped).map((group) => (
            <div key={group.boardId}>
              <div className="flex items-center gap-3 mb-3">
                <Link
                  to={`/projetos/${group.boardId}`}
                  className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base
                             text-slate-800 dark:text-slate-200 hover:text-[#4f46e5] dark:hover:text-indigo-400
                             transition-colors flex items-center gap-1.5"
                >
                  {group.boardTitle}
                  <ArrowUpRight size={14} />
                </Link>
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700
                                 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  {group.tasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {group.tasks.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  value, label, color, dot,
}: { value: number; label: string; color: string; dot: string }) {
  return (
    <div className={`${color} rounded-xl p-4 border border-transparent`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`size-2 rounded-full ${dot}`} />
        <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900 dark:text-slate-100">
          {value}
        </span>
      </div>
      <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs text-slate-500 dark:text-slate-400 font-medium">
        {label}
      </p>
    </div>
  );
}
