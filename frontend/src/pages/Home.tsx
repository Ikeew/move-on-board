import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Plus, Search, MoreVertical, Calendar, LayoutGrid, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { boardsApi, type Board } from "../lib/api";
import {
  getBoardColor,
  setBoardColor,
  BOARD_COLORS,
  formatRelative,
} from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

export function Home() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Novo quadro
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState(BOARD_COLORS[0]);
  const [creating, setCreating] = useState(false);

  // Menu de contexto
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modal editar
  const [editBoard, setEditBoard] = useState<Board | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState(BOARD_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    boardsApi
      .list()
      .then(setBoards)
      .catch(() => toast.error("Erro ao carregar quadros"))
      .finally(() => setLoading(false));
  }, []);

  // Fecha menu ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(null);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = boards.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleCreate() {
    if (!newTitle.trim()) { toast.error("Informe o nome do quadro"); return; }
    setCreating(true);
    try {
      const board = await boardsApi.create({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      });
      setBoardColor(board.id, newColor);
      setBoards((prev) => [board, ...prev]);
      toast.success("Quadro criado!");
      closeModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar quadro");
    } finally {
      setCreating(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setNewTitle("");
    setNewDescription("");
    setNewColor(BOARD_COLORS[0]);
  }

  function openEdit(board: Board) {
    setEditBoard(board);
    setEditTitle(board.title);
    setEditDescription(board.description ?? "");
    setEditColor(getBoardColor(board.id));
    setMenuOpen(null);
  }

  async function handleSaveEdit() {
    if (!editBoard || !editTitle.trim()) { toast.error("Informe o nome do quadro"); return; }
    setSaving(true);
    try {
      const updated = await boardsApi.update(editBoard.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setBoardColor(editBoard.id, editColor);
      setBoards((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      toast.success("Quadro atualizado!");
      setEditBoard(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(board: Board) {
    if (!confirm(`Excluir o quadro "${board.title}"? Isso apagará todas as colunas e tarefas.`)) return;
    try {
      await boardsApi.remove(board.id);
      setBoards((prev) => prev.filter((b) => b.id !== board.id));
      toast.success("Quadro excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    }
    setMenuOpen(null);
  }

  const stats = { total: boards.length };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-10 rounded-full border-4 border-[#4f46e5] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-3xl lg:text-4xl text-[#1e293b] mb-2">
          Olá, {user?.name.split(" ")[0]}!
        </h1>
        <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[#64748b] text-base lg:text-lg">
          Gerencie seus quadros e tarefas de forma visual
        </p>
      </div>

      {/* Search + Ação */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={20} />
          <input
            type="text"
            placeholder="Buscar quadros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#cbd5e1] bg-white
                     font-['Plus_Jakarta_Sans',sans-serif] text-[#1e293b]
                     focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent transition-all"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#4f46e5] text-white rounded-xl
                   font-['Plus_Jakarta_Sans',sans-serif] font-semibold hover:bg-[#4338ca]
                   transition-all shadow-lg shadow-[#4f46e5]/25 hover:shadow-xl"
        >
          <Plus size={20} />
          <span>Novo Quadro</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard color="#ede9fe" dotColor="#4f46e5" value={stats.total} label="Total de Quadros" />
        <StatCard
          color="#dbeafe" dotColor="#3b82f6"
          value={boards.filter((b) => (Date.now() - new Date(b.updated_at).getTime()) / 86400000 <= 7).length}
          label="Ativos (7 dias)"
        />
        <StatCard
          color="#d1fae5" dotColor="#10b981"
          value={boards.filter((b) => (Date.now() - new Date(b.created_at).getTime()) / 86400000 <= 1).length}
          label="Criados Hoje"
        />
        <StatCard color="#fef3c7" dotColor="#f59e0b" value={boards.length} label="Seus Quadros" />
      </div>

      {/* Grid de quadros */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-2xl bg-[#ede9fe] flex items-center justify-center mb-4">
            <LayoutGrid size={32} className="text-[#4f46e5]" />
          </div>
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xl text-[#1e293b] mb-2">
            {searchQuery ? "Nenhum quadro encontrado" : "Nenhum quadro ainda"}
          </h3>
          <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[#64748b] mb-6">
            {searchQuery ? "Tente outro termo de busca" : "Crie seu primeiro quadro para começar!"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#4f46e5] text-white rounded-xl
                       font-['Plus_Jakarta_Sans',sans-serif] font-semibold hover:bg-[#4338ca]
                       transition-all shadow-lg shadow-[#4f46e5]/25"
            >
              <Plus size={20} />
              Criar Quadro
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((board) => {
            const color = getBoardColor(board.id);
            const isMenuOpen = menuOpen === board.id;
            return (
              <div
                key={board.id}
                className="group bg-white rounded-xl border border-[#e2e8f0]
                         hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Cabeçalho colorido — clicável para abrir */}
                <Link to={`/projetos/${board.id}`} className="block rounded-t-xl overflow-hidden">
                  <div className="h-24 relative" style={{ backgroundColor: color }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                  </div>
                </Link>

                {/* Conteúdo */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      to={`/projetos/${board.id}`}
                      className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-[#1e293b]
                               hover:text-[#4f46e5] transition-colors flex-1 min-w-0 truncate"
                    >
                      {board.title}
                    </Link>

                    {/* Menu três pontinhos */}
                    <div
                      className="relative shrink-0"
                      ref={isMenuOpen ? menuRef : undefined}
                    >
                      <button
                        onClick={() => setMenuOpen((prev) => prev === board.id ? null : board.id)}
                        className="text-[#94a3b8] hover:text-[#64748b] p-1 rounded transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-8 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-20 min-w-[160px] py-1">
                          <Link
                            to={`/projetos/${board.id}`}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left
                                     font-['Plus_Jakarta_Sans',sans-serif] text-sm text-[#475569]
                                     hover:bg-[#f1f5f9] transition-colors"
                            onClick={() => setMenuOpen(null)}
                          >
                            <LayoutGrid size={15} />
                            Abrir
                          </Link>
                          <button
                            onClick={() => openEdit(board)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left
                                     font-['Plus_Jakarta_Sans',sans-serif] text-sm text-[#475569]
                                     hover:bg-[#f1f5f9] transition-colors"
                          >
                            <Pencil size={15} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(board)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left
                                     font-['Plus_Jakarta_Sans',sans-serif] text-sm text-[#ef4444]
                                     hover:bg-[#fee2e2] transition-colors"
                          >
                            <Trash2 size={15} />
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {board.description && (
                    <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm text-[#64748b] line-clamp-2 mb-3">
                      {board.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[#94a3b8]">
                    <Calendar size={14} />
                    <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xs">
                      Atualizado {formatRelative(board.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal novo quadro */}
      {showModal && (
        <BoardModal
          title="Novo Quadro"
          titleValue={newTitle}
          descriptionValue={newDescription}
          colorValue={newColor}
          onTitleChange={setNewTitle}
          onDescriptionChange={setNewDescription}
          onColorChange={setNewColor}
          onClose={closeModal}
          onSubmit={handleCreate}
          loading={creating}
          submitLabel="Criar Quadro"
        />
      )}

      {/* Modal editar */}
      {editBoard && (
        <BoardModal
          title="Editar Quadro"
          titleValue={editTitle}
          descriptionValue={editDescription}
          colorValue={editColor}
          onTitleChange={setEditTitle}
          onDescriptionChange={setEditDescription}
          onColorChange={setEditColor}
          onClose={() => setEditBoard(null)}
          onSubmit={handleSaveEdit}
          loading={saving}
          submitLabel="Salvar"
        />
      )}
    </div>
  );
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function StatCard({ color, dotColor, value, label }: {
  color: string; dotColor: string; value: number; label: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[#e2e8f0] hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="size-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
          <div className="size-6 rounded" style={{ backgroundColor: dotColor }} />
        </div>
        <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-[#1e293b]">{value}</span>
      </div>
      <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[#64748b] text-sm font-medium">{label}</p>
    </div>
  );
}

interface BoardModalProps {
  title: string;
  titleValue: string;
  descriptionValue: string;
  colorValue: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  submitLabel: string;
}

function BoardModal({
  title, titleValue, descriptionValue, colorValue,
  onTitleChange, onDescriptionChange, onColorChange,
  onClose, onSubmit, loading, submitLabel,
}: BoardModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-[#1e293b]">{title}</h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b] transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-medium text-[#475569] block mb-2">
              Nome *
            </label>
            <input
              type="text" value={titleValue} onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ex: Sistema de Gestão" autoFocus
              className="w-full px-4 py-3 rounded-xl border border-[#cbd5e1]
                       font-['Plus_Jakarta_Sans',sans-serif] text-[#1e293b]
                       focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            />
          </div>
          <div>
            <label className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-medium text-[#475569] block mb-2">
              Descrição
            </label>
            <textarea
              value={descriptionValue} onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Descreva o objetivo do quadro..." rows={3}
              className="w-full px-4 py-3 rounded-xl border border-[#cbd5e1]
                       font-['Plus_Jakarta_Sans',sans-serif] text-[#1e293b]
                       focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent resize-none"
            />
          </div>
          <div>
            <label className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-medium text-[#475569] block mb-2">
              Cor
            </label>
            <div className="flex gap-3 flex-wrap">
              {BOARD_COLORS.map((cor) => (
                <button
                  key={cor} onClick={() => onColorChange(cor)}
                  className="size-10 rounded-lg transition-all"
                  style={{
                    backgroundColor: cor,
                    outline: colorValue === cor ? `3px solid ${cor}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-[#cbd5e1] text-[#475569]
                     font-['Plus_Jakarta_Sans',sans-serif] font-semibold hover:bg-[#f1f5f9] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit} disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-[#4f46e5] text-white
                     font-['Plus_Jakarta_Sans',sans-serif] font-semibold hover:bg-[#4338ca]
                     disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#4f46e5]/25"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </div>
            ) : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
