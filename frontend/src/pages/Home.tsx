import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus, Search, MoreVertical, Calendar, LayoutGrid, X } from "lucide-react";
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

  useEffect(() => {
    boardsApi
      .list()
      .then(setBoards)
      .catch(() => toast.error("Erro ao carregar quadros"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = boards.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleCreate() {
    if (!newTitle.trim()) {
      toast.error("Informe o nome do quadro");
      return;
    }
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

  const stats = {
    total: boards.length,
    totalTasks: 0, // precisaria carregar tasks de cada board
  };

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
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar quadros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#cbd5e1] bg-white
                     font-['Plus_Jakarta_Sans',sans-serif] text-[#1e293b]
                     focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent
                     transition-all"
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
        <StatCard
          color="#ede9fe"
          dotColor="#4f46e5"
          value={stats.total}
          label="Total de Quadros"
        />
        <StatCard
          color="#dbeafe"
          dotColor="#3b82f6"
          value={boards.filter((b) => {
            const days =
              (Date.now() - new Date(b.updated_at).getTime()) /
              (1000 * 60 * 60 * 24);
            return days <= 7;
          }).length}
          label="Ativos (7 dias)"
        />
        <StatCard
          color="#d1fae5"
          dotColor="#10b981"
          value={boards.filter((b) => {
            const days =
              (Date.now() - new Date(b.created_at).getTime()) /
              (1000 * 60 * 60 * 24);
            return days <= 1;
          }).length}
          label="Criados Hoje"
        />
        <StatCard
          color="#fef3c7"
          dotColor="#f59e0b"
          value={boards.length}
          label="Seus Quadros"
        />
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
            {searchQuery
              ? "Tente outro termo de busca"
              : "Crie seu primeiro quadro para começar!"}
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
            return (
              <Link
                key={board.id}
                to={`/projetos/${board.id}`}
                className="group bg-white rounded-xl border border-[#e2e8f0] overflow-hidden
                         hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Cabeçalho colorido */}
                <div className="h-24 relative" style={{ backgroundColor: color }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                  <button
                    onClick={(e) => e.preventDefault()}
                    className="absolute top-3 right-3 size-8 rounded-lg bg-white/20 backdrop-blur-sm
                             flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <MoreVertical size={18} className="text-white" />
                  </button>
                </div>

                {/* Conteúdo */}
                <div className="p-6">
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xl text-[#1e293b] mb-2">
                    {board.title}
                  </h3>
                  {board.description && (
                    <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm text-[#64748b] line-clamp-2 mb-4">
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
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal novo quadro */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-[#1e293b]">
                Novo Quadro
              </h2>
              <button
                onClick={closeModal}
                className="text-[#94a3b8] hover:text-[#64748b] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-medium text-[#475569] block mb-2">
                  Nome do Quadro *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Sistema de Gestão"
                  autoFocus
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
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descreva o objetivo do quadro..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-[#cbd5e1]
                           font-['Plus_Jakarta_Sans',sans-serif] text-[#1e293b]
                           focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-medium text-[#475569] block mb-2">
                  Cor do Quadro
                </label>
                <div className="flex gap-3 flex-wrap">
                  {BOARD_COLORS.map((cor) => (
                    <button
                      key={cor}
                      onClick={() => setNewColor(cor)}
                      className="size-10 rounded-lg transition-all"
                      style={{
                        backgroundColor: cor,
                        outline: newColor === cor ? `3px solid ${cor}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 rounded-xl border border-[#cbd5e1] text-[#475569]
                         font-['Plus_Jakarta_Sans',sans-serif] font-semibold hover:bg-[#f1f5f9] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 px-4 py-3 rounded-xl bg-[#4f46e5] text-white
                         font-['Plus_Jakarta_Sans',sans-serif] font-semibold hover:bg-[#4338ca]
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-colors shadow-lg shadow-[#4f46e5]/25"
              >
                {creating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Criando...</span>
                  </div>
                ) : (
                  "Criar Quadro"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  color,
  dotColor,
  value,
  label,
}: {
  color: string;
  dotColor: string;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[#e2e8f0] hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div
          className="size-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <div className="size-6 rounded" style={{ backgroundColor: dotColor }} />
        </div>
        <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-[#1e293b]">
          {value}
        </span>
      </div>
      <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[#64748b] text-sm font-medium">
        {label}
      </p>
    </div>
  );
}
