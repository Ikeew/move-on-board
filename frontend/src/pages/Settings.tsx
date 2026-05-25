import { useEffect, useState } from "react";
import {
  User as UserIcon,
  Bell,
  Palette,
  ShieldCheck,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { authApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getInitials } from "../lib/utils";

type Section = "perfil" | "notificacoes" | "aparencia" | "seguranca";

const SECTIONS: { id: Section; label: string; icon: typeof UserIcon }[] = [
  { id: "perfil", label: "Perfil", icon: UserIcon },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "aparencia", label: "Aparência", icon: Palette },
  { id: "seguranca", label: "Segurança", icon: ShieldCheck },
];

const AVATAR_COLORS = [
  "#4f46e5", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];
const AVATAR_COLOR_KEY = "mob_avatar_color";

function getAvatarColor(): string {
  return localStorage.getItem(AVATAR_COLOR_KEY) ?? AVATAR_COLORS[0];
}
function setAvatarColor(c: string) {
  localStorage.setItem(AVATAR_COLOR_KEY, c);
}

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${checked ? "bg-[#4f46e5]" : "bg-[#cbd5e1] dark:bg-slate-600"}`}
    >
      <span
        className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform
                    ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

// ─── Seção Perfil ─────────────────────────────────────────────────────────────
function SectionPerfil() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarColor, setAvatarColorState] = useState(getAvatarColor());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setBio(user.bio ?? "");
    }
  }, [user]);

  function handleColorChange(c: string) {
    setAvatarColorState(c);
    setAvatarColor(c);
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        name: name.trim(),
        email: email.trim(),
        bio: bio.trim() || null,
      });
      updateUser(updated);
      toast.success("Perfil atualizado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">Perfil</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-['Plus_Jakarta_Sans',sans-serif]">Gerencie suas informações pessoais</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div
            className="size-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
            style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` }}
          >
            {user ? getInitials(user.name) : "?"}
          </div>
          <div className="absolute -bottom-1 -right-1 size-7 bg-white dark:bg-slate-700 rounded-full border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center">
            <Camera size={13} className="text-slate-500 dark:text-slate-300" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">Cor do avatar</p>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => handleColorChange(c)}
                className="size-7 rounded-full transition-all"
                style={{
                  backgroundColor: c,
                  outline: avatarColor === c ? `3px solid ${c}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Campos */}
      <div className="grid gap-5 max-w-lg">
        <Field label="Nome *">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={input}
          />
        </Field>
        <Field label="E-mail *">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
          />
        </Field>
        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Conte um pouco sobre você..."
            className={`${input} resize-none`}
          />
          <p className="text-xs text-slate-400 text-right">{bio.length}/300</p>
        </Field>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 rounded-xl bg-[#4f46e5] text-white font-semibold text-sm
                   hover:bg-[#4338ca] disabled:opacity-60 transition-colors
                   font-['Plus_Jakarta_Sans',sans-serif] shadow-lg shadow-[#4f46e5]/25"
      >
        {saving ? "Salvando..." : "Salvar alterações"}
      </button>
    </div>
  );
}

// ─── Seção Notificações ───────────────────────────────────────────────────────
const NOTIF_KEY = "mob_notifications";

function loadNotifPrefs() {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function SectionNotificacoes() {
  const defaults = { email: true, push: false, concluded: true, comments: true, deadlines: true };
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ ...defaults, ...loadNotifPrefs() });

  function toggle(key: string) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">Notificações</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-['Plus_Jakarta_Sans',sans-serif]">Escolha como deseja receber notificações</p>
      </div>

      <div className="max-w-lg space-y-1 divide-y divide-slate-100 dark:divide-slate-700">
        <NotifRow
          icon="✉️"
          title="Notificações por E-mail"
          description="Receba atualizações por e-mail"
          checked={prefs.email}
          onToggle={() => toggle("email")}
        />
        <NotifRow
          icon="🔔"
          title="Notificações Push"
          description="Receba notificações no navegador"
          checked={prefs.push}
          onToggle={() => toggle("push")}
        />
      </div>

      <div className="max-w-lg">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
          Notificar sobre
        </h3>
        <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-700">
          <NotifRow
            title="Tarefas Concluídas"
            description="Quando uma tarefa for marcada como concluída"
            checked={prefs.concluded}
            onToggle={() => toggle("concluded")}
          />
          <NotifRow
            title="Novos Comentários"
            description="Quando alguém comentar em suas tarefas"
            checked={prefs.comments}
            onToggle={() => toggle("comments")}
          />
          <NotifRow
            title="Prazos Pendentes"
            description="Lembretes de tarefas próximas ao prazo"
            checked={prefs.deadlines}
            onToggle={() => toggle("deadlines")}
          />
        </div>
      </div>
    </div>
  );
}

function NotifRow({
  icon,
  title,
  description,
  checked,
  onToggle,
}: {
  icon?: string;
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        {icon && <span className="text-lg">{icon}</span>}
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-['Plus_Jakarta_Sans',sans-serif]">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-['Plus_Jakarta_Sans',sans-serif]">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onToggle} />
    </div>
  );
}

// ─── Seção Aparência ──────────────────────────────────────────────────────────
function SectionAparencia() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">Aparência</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-['Plus_Jakarta_Sans',sans-serif]">Personalize a interface do sistema</p>
      </div>

      <div className="max-w-lg">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 font-['Plus_Jakarta_Sans',sans-serif]">Tema</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Claro */}
          <button
            onClick={() => setTheme("light")}
            className={`relative rounded-2xl border-2 overflow-hidden transition-all
                        ${theme === "light" ? "border-[#4f46e5] shadow-lg shadow-[#4f46e5]/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}
          >
            <div className="bg-[#f8fafc] p-4">
              <div className="bg-white rounded-xl p-3 shadow-sm mb-2">
                <div className="h-2 w-16 bg-slate-200 rounded mb-1.5" />
                <div className="h-2 w-10 bg-slate-100 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-12 bg-white rounded-xl shadow-sm" />
                <div className="flex-1 h-12 bg-white rounded-xl shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
              <Sun size={14} className="text-amber-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-['Plus_Jakarta_Sans',sans-serif]">Claro</span>
            </div>
            {theme === "light" && (
              <div className="absolute top-2 right-2 size-5 rounded-full bg-[#4f46e5] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">✓</span>
              </div>
            )}
          </button>

          {/* Escuro */}
          <button
            onClick={() => setTheme("dark")}
            className={`relative rounded-2xl border-2 overflow-hidden transition-all
                        ${theme === "dark" ? "border-[#4f46e5] shadow-lg shadow-[#4f46e5]/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}
          >
            <div className="bg-slate-900 p-4">
              <div className="bg-slate-800 rounded-xl p-3 mb-2">
                <div className="h-2 w-16 bg-slate-600 rounded mb-1.5" />
                <div className="h-2 w-10 bg-slate-700 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-12 bg-slate-800 rounded-xl" />
                <div className="flex-1 h-12 bg-slate-800 rounded-xl" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 py-3 bg-slate-800 border-t border-slate-700">
              <Moon size={14} className="text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200 font-['Plus_Jakarta_Sans',sans-serif]">Escuro</span>
            </div>
            {theme === "dark" && (
              <div className="absolute top-2 right-2 size-5 rounded-full bg-[#4f46e5] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">✓</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Seção Segurança ──────────────────────────────────────────────────────────
function SectionSeguranca() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleChange() {
    if (!current || !newPass || !confirm) { toast.error("Preencha todos os campos"); return; }
    if (newPass !== confirm) { toast.error("As senhas não coincidem"); return; }
    if (newPass.length < 6) { toast.error("A nova senha deve ter pelo menos 6 caracteres"); return; }
    setSaving(true);
    try {
      await authApi.changePassword({ current_password: current, new_password: newPass });
      toast.success("Senha alterada com sucesso!");
      setCurrent(""); setNewPass(""); setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">Segurança</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-['Plus_Jakarta_Sans',sans-serif]">Mantenha sua conta protegida</p>
      </div>

      <div className="max-w-lg space-y-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-['Plus_Jakarta_Sans',sans-serif]">
          Alterar senha
        </h3>

        <Field label="Senha atual">
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={`${input} pr-10`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <Field label="Nova senha">
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className={`${input} pr-10`}
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Barra de força */}
          {newPass.length > 0 && (
            <div className="mt-1.5">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength(newPass) >= i
                        ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-amber-400" : i <= 3 ? "bg-yellow-400" : "bg-green-500"
                        : "bg-slate-200 dark:bg-slate-600"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400 font-['Plus_Jakarta_Sans',sans-serif]">
                {["", "Fraca", "Razoável", "Boa", "Forte"][passwordStrength(newPass)]}
              </p>
            </div>
          )}
        </Field>

        <Field label="Confirmar nova senha">
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={`${input} ${confirm && newPass && confirm !== newPass ? "border-red-400 focus:ring-red-400" : ""}`}
            placeholder="Repita a nova senha"
          />
          {confirm && newPass && confirm !== newPass && (
            <p className="text-xs text-red-500 mt-1 font-['Plus_Jakarta_Sans',sans-serif]">As senhas não coincidem</p>
          )}
        </Field>

        <button
          onClick={handleChange}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-[#4f46e5] text-white font-semibold text-sm
                     hover:bg-[#4338ca] disabled:opacity-60 transition-colors
                     font-['Plus_Jakarta_Sans',sans-serif] shadow-lg shadow-[#4f46e5]/25"
        >
          {saving ? "Alterando..." : "Alterar senha"}
        </button>
      </div>
    </div>
  );
}

function passwordStrength(p: string): number {
  let score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10) score++;
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return Math.min(score, 4);
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
const input =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 " +
  "text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function Settings() {
  const [active, setActive] = useState<Section>("perfil");

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-3xl text-slate-900 dark:text-slate-100">
            Configurações
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-['Plus_Jakarta_Sans',sans-serif] mt-1">
            Gerencie sua conta e preferências
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar de seções */}
          <nav className="lg:w-52 shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2">
              {SECTIONS.map((s) => {
                const isActive = active === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold
                                font-['Plus_Jakarta_Sans',sans-serif] transition-all
                                ${isActive
                                  ? "bg-[#4f46e5] text-white shadow-md"
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                  >
                    <s.icon size={16} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Conteúdo */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 lg:p-8">
            {active === "perfil" && <SectionPerfil />}
            {active === "notificacoes" && <SectionNotificacoes />}
            {active === "aparencia" && <SectionAparencia />}
            {active === "seguranca" && <SectionSeguranca />}
          </div>
        </div>
      </div>
    </div>
  );
}
