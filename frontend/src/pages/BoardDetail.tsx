import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Tag,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  boardsApi,
  columnsApi,
  tasksApi,
  labelsApi,
  type Board,
  type Column,
  type Task,
  type Label,
  type Priority,
} from "../lib/api";
import { formatDate } from "../lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const PRIORITY_COLOR: Record<Priority, string> = {
  low: "bg-[#d1fae5] text-[#065f46]",
  medium: "bg-[#fef3c7] text-[#92400e]",
  high: "bg-[#fee2e2] text-[#991b1b]",
};

const LABEL_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

// ─── TaskCard ─────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDragStart: (task: Task, columnId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetTask: Task) => void;
}

function TaskCard({
  task,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task, task.column_id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
      onDrop={(e) => { e.preventDefault(); onDrop(task); }}
      onClick={() => onEdit(task)}
      className="bg-white border border-[#e2e8f0] rounded-xl p-3 cursor-pointer
                 hover:shadow-md hover:border-[#c7d2fe] transition-all group select-none"
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
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

      {/* Título + menu */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-semibold text-[#1e293b] leading-snug flex-1">
          {task.title}
        </p>
        <div className="relative shrink-0" ref={menuOpen ? menuRef : undefined}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="text-[#cbd5e1] hover:text-[#64748b] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-5 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-20 min-w-[140px] py-1">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(task); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-[#ef4444]
                           font-['Plus_Jakarta_Sans',sans-serif] hover:bg-[#fee2e2]"
              >
                <Trash2 size={14} /> Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Descrição */}
      {task.description && (
        <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs text-[#94a3b8] mt-1 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority]}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>
        {task.due_date && (
          <span className="flex items-center gap-1 text-[10px] text-[#94a3b8]">
            <Calendar size={10} />
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onAddTask: (columnId: string) => void;
  onEditColumn: (column: Column) => void;
  onDeleteColumn: (column: Column) => void;
  onMoveLeft: (column: Column) => void;
  onMoveRight: (column: Column) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onDragStart: (task: Task, columnId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropOnColumn: (targetColumnId: string) => void;
  onDropOnTask: (targetTask: Task) => void;
}

function KanbanColumn({
  column,
  tasks,
  canMoveLeft,
  canMoveRight,
  onAddTask,
  onEditColumn,
  onDeleteColumn,
  onMoveLeft,
  onMoveRight,
  onEditTask,
  onDeleteTask,
  onDragStart,
  onDragOver,
  onDropOnColumn,
  onDropOnTask,
}: KanbanColumnProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sorted = [...tasks].sort((a, b) => a.position - b.position);

  return (
    <div
      className="flex flex-col w-72 shrink-0"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); onDragOver(e); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onDropOnColumn(column.id); }}
    >
      {/* Header da coluna */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-[#1e293b]">
            {column.title}
          </h3>
          <span className="text-xs bg-[#f1f5f9] text-[#64748b] font-semibold px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddTask(column.id)}
            className="text-[#94a3b8] hover:text-[#4f46e5] transition-colors p-1 rounded"
          >
            <Plus size={16} />
          </button>
          <div className="relative" ref={menuOpen ? menuRef : undefined}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="text-[#94a3b8] hover:text-[#64748b] transition-colors p-1 rounded"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-20 min-w-[170px] py-1">
                {canMoveLeft && (
                  <button
                    onClick={() => { onMoveLeft(column); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-[#475569]
                               font-['Plus_Jakarta_Sans',sans-serif] hover:bg-[#f1f5f9]"
                  >
                    <ChevronLeft size={14} /> Mover para esquerda
                  </button>
                )}
                {canMoveRight && (
                  <button
                    onClick={() => { onMoveRight(column); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-[#475569]
                               font-['Plus_Jakarta_Sans',sans-serif] hover:bg-[#f1f5f9]"
                  >
                    <ChevronRight size={14} /> Mover para direita
                  </button>
                )}
                {(canMoveLeft || canMoveRight) && (
                  <div className="my-1 border-t border-[#f1f5f9]" />
                )}
                <button
                  onClick={() => { onEditColumn(column); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-[#475569]
                             font-['Plus_Jakarta_Sans',sans-serif] hover:bg-[#f1f5f9]"
                >
                  <Pencil size={14} /> Renomear
                </button>
                <button
                  onClick={() => { onDeleteColumn(column); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-[#ef4444]
                             font-['Plus_Jakarta_Sans',sans-serif] hover:bg-[#fee2e2]"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Área de tarefas */}
      <div
        className={`flex-1 flex flex-col gap-2 min-h-[120px] rounded-xl p-2 transition-colors
                    ${isDragOver ? "bg-[#ede9fe]" : "bg-[#f8fafc]"}`}
      >
        {sorted.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDropOnTask}
          />
        ))}

        {/* Botão inline adicionar tarefa */}
        <button
          onClick={() => onAddTask(column.id)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#94a3b8] text-sm
                     font-['Plus_Jakarta_Sans',sans-serif] hover:bg-white hover:text-[#4f46e5]
                     transition-all mt-auto"
        >
          <Plus size={14} />
          Adicionar tarefa
        </button>
      </div>
    </div>
  );
}

// ─── TaskModal ────────────────────────────────────────────────────────────────

interface TaskModalProps {
  task?: Task | null;
  columnId: string;
  labels: Label[];
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    priority: Priority;
    due_date: string;
    label_ids: string[];
  }) => Promise<void>;
}

function TaskModal({ task, columnId: _columnId, labels, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(
    task?.due_date ? task.due_date.slice(0, 10) : ""
  );
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    task?.labels.map((l) => l.id) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (!title.trim()) { toast.error("Informe o título da tarefa"); return; }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate,
        label_ids: selectedLabelIds,
      });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xl text-[#1e293b]">
            {task ? "Editar Tarefa" : "Nova Tarefa"}
          </h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-medium text-[#475569] block mb-1">
              Título *
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Implementar autenticação"
              className="w-full px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-[#1e293b]
                         font-['Plus_Jakarta_Sans',sans-serif] focus:outline-none focus:ring-2
                         focus:ring-[#4f46e5] focus:border-transparent"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-medium text-[#475569] block mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detalhes da tarefa..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-[#1e293b]
                         font-['Plus_Jakarta_Sans',sans-serif] focus:outline-none focus:ring-2
                         focus:ring-[#4f46e5] focus:border-transparent resize-none"
            />
          </div>

          {/* Prioridade + Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-medium text-[#475569] block mb-1">
                Prioridade
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-[#1e293b]
                             font-['Plus_Jakarta_Sans',sans-serif] focus:outline-none focus:ring-2
                             focus:ring-[#4f46e5] appearance-none bg-white"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-medium text-[#475569] block mb-1">
                Data limite
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-[#1e293b]
                           font-['Plus_Jakarta_Sans',sans-serif] focus:outline-none focus:ring-2
                           focus:ring-[#4f46e5]"
              />
            </div>
          </div>

          {/* Labels */}
          {labels.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowLabels((v) => !v)}
                className="flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif] text-sm
                           font-medium text-[#475569] mb-2"
              >
                <Tag size={14} />
                Etiquetas
                <ChevronDown size={14} className={`transition-transform ${showLabels ? "rotate-180" : ""}`} />
              </button>
              {showLabels && (
                <div className="flex flex-wrap gap-2">
                  {labels.map((l) => {
                    const selected = selectedLabelIds.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => toggleLabel(l.id)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border-2 transition-all
                                   font-['Plus_Jakarta_Sans',sans-serif]`}
                        style={{
                          backgroundColor: selected ? l.color : "transparent",
                          borderColor: l.color,
                          color: selected ? "white" : l.color,
                        }}
                      >
                        {l.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-[#475569]
                       font-['Plus_Jakarta_Sans',sans-serif] font-semibold hover:bg-[#f1f5f9]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#4f46e5] text-white
                       font-['Plus_Jakarta_Sans',sans-serif] font-semibold hover:bg-[#4338ca]
                       disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </span>
            ) : task ? "Salvar" : "Criar Tarefa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ColumnModal ──────────────────────────────────────────────────────────────

interface ColumnModalProps {
  column?: Column | null;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
}

function ColumnModal({ column, onClose, onSave }: ColumnModalProps) {
  const [title, setTitle] = useState(column?.title ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) { toast.error("Informe o nome da lista"); return; }
    setSaving(true);
    try {
      await onSave(title.trim());
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-[#1e293b]">
            {column ? "Renomear Lista" : "Nova Lista"}
          </h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]">
            <X size={20} />
          </button>
        </div>
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Ex: Em andamento"
          className="w-full px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-[#1e293b]
                     font-['Plus_Jakarta_Sans',sans-serif] focus:outline-none focus:ring-2
                     focus:ring-[#4f46e5] mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-[#475569]
                       font-['Plus_Jakarta_Sans',sans-serif] font-semibold hover:bg-[#f1f5f9]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#4f46e5] text-white
                       font-['Plus_Jakarta_Sans',sans-serif] font-semibold hover:bg-[#4338ca]
                       disabled:opacity-60 transition-colors"
          >
            {saving ? "Salvando..." : column ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LabelManager ─────────────────────────────────────────────────────────────

interface LabelManagerProps {
  boardId: string;
  labels: Label[];
  onLabelsChange: (labels: Label[]) => void;
  onClose: () => void;
}

function LabelManager({ boardId, labels, onLabelsChange, onClose }: LabelManagerProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(LABEL_COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) { toast.error("Informe o nome"); return; }
    setSaving(true);
    try {
      const label = await labelsApi.create(boardId, { name: name.trim(), color });
      onLabelsChange([...labels, label]);
      setName("");
      setColor(LABEL_COLORS[0]);
      toast.success("Etiqueta criada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar etiqueta");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(label: Label) {
    try {
      await labelsApi.remove(label.id);
      onLabelsChange(labels.filter((l) => l.id !== label.id));
      toast.success("Etiqueta removida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-[#1e293b]">
            Etiquetas
          </h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]">
            <X size={20} />
          </button>
        </div>

        {/* Criar nova */}
        <div className="mb-4 p-3 bg-[#f8fafc] rounded-xl">
          <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-semibold text-[#64748b] mb-2 uppercase tracking-wide">
            Nova etiqueta
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Nome da etiqueta"
            className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-sm text-[#1e293b]
                       font-['Plus_Jakarta_Sans',sans-serif] focus:outline-none focus:ring-2
                       focus:ring-[#4f46e5] mb-2"
          />
          <div className="flex items-center gap-2 mb-3">
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="size-6 rounded-full transition-all"
                style={{
                  backgroundColor: c,
                  outline: color === c ? `3px solid ${c}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full px-3 py-2 rounded-lg bg-[#4f46e5] text-white text-sm
                       font-['Plus_Jakarta_Sans',sans-serif] font-semibold hover:bg-[#4338ca]
                       disabled:opacity-60 transition-colors"
          >
            {saving ? "Criando..." : "Criar Etiqueta"}
          </button>
        </div>

        {/* Lista */}
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {labels.length === 0 && (
            <p className="text-center text-sm text-[#94a3b8] font-['Plus_Jakarta_Sans',sans-serif] py-4">
              Nenhuma etiqueta ainda
            </p>
          )}
          {labels.map((l) => (
            <div key={l.id} className="flex items-center justify-between">
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: l.color }}
              >
                {l.name}
              </span>
              <button
                onClick={() => handleDelete(l)}
                className="text-[#cbd5e1] hover:text-[#ef4444] transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BoardDetail (página principal) ──────────────────────────────────────────

export function BoardDetail() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);

  // Drag state
  const dragTaskRef = useRef<{ task: Task; fromColumnId: string } | null>(null);

  // Modals
  const [columnModal, setColumnModal] = useState<{ open: boolean; column?: Column }>({ open: false });
  const [taskModal, setTaskModal] = useState<{ open: boolean; columnId?: string; task?: Task }>({ open: false });
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    Promise.all([
      boardsApi.get(boardId),
      columnsApi.list(boardId),
      tasksApi.listByBoard(boardId),
      labelsApi.list(boardId),
    ])
      .then(([b, cols, tsks, lbls]) => {
        setBoard(b);
        setColumns(cols.sort((a, b) => a.position - b.position));
        setTasks(tsks);
        setLabels(lbls);
      })
      .catch(() => {
        toast.error("Erro ao carregar o quadro");
        navigate("/projetos");
      })
      .finally(() => setLoading(false));
  }, [boardId, navigate]);

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  function handleDragStart(task: Task, fromColumnId: string) {
    dragTaskRef.current = { task, fromColumnId };
  }

  function handleDropOnColumn(targetColumnId: string) {
    const drag = dragTaskRef.current;
    if (!drag) return;
    dragTaskRef.current = null;

    const columnTasks = tasks
      .filter((t) => t.column_id === targetColumnId)
      .sort((a, b) => a.position - b.position);
    const newPosition = columnTasks.length;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === drag.task.id
          ? { ...t, column_id: targetColumnId, position: newPosition }
          : t
      )
    );

    tasksApi
      .move(drag.task.id, { column_id: targetColumnId, position: newPosition })
      .catch(() => {
        toast.error("Erro ao mover tarefa");
        setTasks((prev) =>
          prev.map((t) =>
            t.id === drag.task.id ? drag.task : t
          )
        );
      });
  }

  function handleDropOnTask(targetTask: Task) {
    const drag = dragTaskRef.current;
    if (!drag || drag.task.id === targetTask.id) return;
    dragTaskRef.current = null;

    const targetColumnId = targetTask.column_id;
    const targetPosition = targetTask.position;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === drag.task.id
          ? { ...t, column_id: targetColumnId, position: targetPosition }
          : t
      )
    );

    tasksApi
      .move(drag.task.id, { column_id: targetColumnId, position: targetPosition })
      .catch(() => {
        toast.error("Erro ao mover tarefa");
        setTasks((prev) =>
          prev.map((t) => (t.id === drag.task.id ? drag.task : t))
        );
      });
  }

  // ── Column actions ─────────────────────────────────────────────────────────

  async function handleMoveColumn(column: Column, direction: "left" | "right") {
    const sorted = [...columns].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((c) => c.id === column.id);
    const swapIdx = direction === "left" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const swapped = sorted[swapIdx];
    const newOrder = sorted.map((c) => {
      if (c.id === column.id) return { ...c, position: swapped.position };
      if (c.id === swapped.id) return { ...c, position: column.position };
      return c;
    });

    setColumns(newOrder);

    try {
      await columnsApi.reorder(
        boardId!,
        newOrder.map((c) => ({ id: c.id, position: c.position }))
      );
    } catch {
      toast.error("Erro ao mover lista");
      setColumns(sorted);
    }
  }

  async function handleCreateColumn(title: string) {
    const col = await columnsApi.create(boardId!, { title });
    setColumns((prev) => [...prev, col].sort((a, b) => a.position - b.position));
    toast.success("Lista criada!");
  }

  async function handleEditColumn(title: string) {
    const col = columnModal.column!;
    const updated = await columnsApi.update(col.id, { title });
    setColumns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    toast.success("Lista atualizada!");
  }

  async function handleDeleteColumn(column: Column) {
    if (!confirm(`Excluir a lista "${column.title}"? Todas as tarefas serão removidas.`)) return;
    await columnsApi.remove(column.id);
    setColumns((prev) => prev.filter((c) => c.id !== column.id));
    setTasks((prev) => prev.filter((t) => t.column_id !== column.id));
    toast.success("Lista excluída");
  }

  // ── Task actions ───────────────────────────────────────────────────────────

  async function handleCreateTask(data: {
    title: string;
    description: string;
    priority: Priority;
    due_date: string;
    label_ids: string[];
  }) {
    const colId = taskModal.columnId!;
    const task = await tasksApi.create(colId, {
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      due_date: data.due_date || undefined,
      label_ids: data.label_ids,
    });
    setTasks((prev) => [...prev, task]);
    toast.success("Tarefa criada!");
  }

  async function handleEditTask(data: {
    title: string;
    description: string;
    priority: Priority;
    due_date: string;
    label_ids: string[];
  }) {
    const task = taskModal.task!;
    const updated = await tasksApi.update(task.id, {
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      due_date: data.due_date || undefined,
      label_ids: data.label_ids,
    });
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    toast.success("Tarefa atualizada!");
  }

  async function handleDeleteTask(task: Task) {
    if (!confirm(`Excluir a tarefa "${task.title}"?`)) return;
    await tasksApi.remove(task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    toast.success("Tarefa excluída");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-10 rounded-full border-4 border-[#4f46e5] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <AlertCircle size={48} className="text-[#ef4444]" />
        <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[#64748b]">Quadro não encontrado</p>
        <Link to="/projetos" className="text-[#4f46e5] underline font-['Plus_Jakarta_Sans',sans-serif]">
          Voltar para Quadros
        </Link>
      </div>
    );
  }

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/projetos"
            className="text-[#94a3b8] hover:text-[#4f46e5] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xl text-[#1e293b] leading-tight">
              {board.title}
            </h1>
            {board.description && (
              <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm text-[#64748b]">
                {board.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLabelManagerOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#e2e8f0] text-[#475569]
                       font-['Plus_Jakarta_Sans',sans-serif] text-sm font-semibold hover:bg-[#f1f5f9] transition-colors"
          >
            <Tag size={16} />
            <span className="hidden sm:inline">Etiquetas</span>
          </button>
          <button
            onClick={() => setColumnModal({ open: true })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4f46e5] text-white
                       font-['Plus_Jakarta_Sans',sans-serif] text-sm font-semibold hover:bg-[#4338ca]
                       transition-colors shadow-lg shadow-[#4f46e5]/25"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nova Lista</span>
          </button>
        </div>
      </div>

      {/* Board area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-6 h-full items-start min-w-max">
          {sortedColumns.map((col, idx) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasks.filter((t) => t.column_id === col.id)}
              canMoveLeft={idx > 0}
              canMoveRight={idx < sortedColumns.length - 1}
              onAddTask={(colId) => setTaskModal({ open: true, columnId: colId })}
              onEditColumn={(c) => setColumnModal({ open: true, column: c })}
              onDeleteColumn={handleDeleteColumn}
              onMoveLeft={(c) => handleMoveColumn(c, "left")}
              onMoveRight={(c) => handleMoveColumn(c, "right")}
              onEditTask={(t) => setTaskModal({ open: true, task: t, columnId: t.column_id })}
              onDeleteTask={handleDeleteTask}
              onDragStart={handleDragStart}
              onDragOver={(e) => e.preventDefault()}
              onDropOnColumn={handleDropOnColumn}
              onDropOnTask={handleDropOnTask}
            />
          ))}

          {/* Botão adicionar coluna inline */}
          {columns.length === 0 && (
            <div className="flex flex-col items-center justify-center w-72 h-48 border-2 border-dashed
                            border-[#cbd5e1] rounded-2xl text-center">
              <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[#94a3b8] text-sm mb-3">
                Nenhuma lista ainda
              </p>
              <button
                onClick={() => setColumnModal({ open: true })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4f46e5] text-white
                           font-['Plus_Jakarta_Sans',sans-serif] text-sm font-semibold hover:bg-[#4338ca]"
              >
                <Plus size={16} /> Criar lista
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Column modal */}
      {columnModal.open && (
        <ColumnModal
          column={columnModal.column}
          onClose={() => setColumnModal({ open: false })}
          onSave={columnModal.column ? handleEditColumn : handleCreateColumn}
        />
      )}

      {/* Task modal */}
      {taskModal.open && taskModal.columnId && (
        <TaskModal
          task={taskModal.task}
          columnId={taskModal.columnId}
          labels={labels}
          onClose={() => setTaskModal({ open: false })}
          onSave={taskModal.task ? handleEditTask : handleCreateTask}
        />
      )}

      {/* Label manager */}
      {labelManagerOpen && (
        <LabelManager
          boardId={boardId!}
          labels={labels}
          onLabelsChange={setLabels}
          onClose={() => setLabelManagerOpen(false)}
        />
      )}
    </div>
  );
}
