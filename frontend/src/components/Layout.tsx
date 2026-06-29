import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  Menu,
  X,
  Home,
  FolderKanban,
  LogOut,
  Settings,
  CheckSquare,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { getInitials } from "../lib/utils";
import { notificationsApi, type Notification } from "../lib/api";

const menuItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: FolderKanban, label: "Quadros", path: "/projetos" },
  { icon: CheckSquare, label: "Tarefas", path: "/tarefas" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

const NOTIF_KEY = "mob_notifications";

function loadNotifPrefs(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_KEY) ?? "{}");
  } catch {
    return {};
  }
}

const NOTIF_TYPE_PREF: Record<string, string> = {
  assigned: "push",
  deadline: "deadlines",
};

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;
    notificationsApi.list().then((notifs) => {
      if (!notifs.length) return;
      setNotifications(notifs);
      const prefs = loadNotifPrefs();
      const defaults: Record<string, boolean> = { push: false, deadlines: true };
      const effective = { ...defaults, ...prefs };

      notifs.forEach((n) => {
        const prefKey = NOTIF_TYPE_PREF[n.type];
        if (prefKey && effective[prefKey] === false) return;
        toast(n.title, {
          description: n.body,
          duration: 6000,
        });
      });

      notificationsApi.markAllRead().catch(() => {});
    }).catch(() => {});
  }, [user]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const unreadCount = notifications.length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] dark:bg-slate-900">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-[280px] bg-white dark:bg-slate-800 border-r border-[#e2e8f0] dark:border-slate-700
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-[#e2e8f0] dark:border-slate-700">
            <div className="flex gap-2 items-center">
              <div className="bg-[#4f46e5] rounded-xl size-8 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="3" y="3" width="7" height="18" rx="2" fill="white" fillOpacity="0.9" />
                  <rect x="14" y="3" width="7" height="10" rx="2" fill="white" fillOpacity="0.6" />
                  <rect x="14" y="17" width="7" height="4" rx="2" fill="white" fillOpacity="0.6" />
                </svg>
              </div>
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-[#1e293b] dark:text-slate-100 text-lg">
                Move On Board
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-[#64748b] hover:text-[#1e293b]"
            >
              <X size={24} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      font-['Plus_Jakarta_Sans',sans-serif] font-medium text-[15px]
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-[#4f46e5] text-white shadow-lg shadow-[#4f46e5]/25"
                          : "text-[#475569] dark:text-slate-400 hover:bg-[#f1f5f9] dark:hover:bg-slate-700 hover:text-[#1e293b] dark:hover:text-slate-100"
                      }
                    `}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User */}
          <div className="p-4 border-t border-[#e2e8f0] dark:border-slate-700">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-slate-700 cursor-pointer transition-colors group">
              <div className="size-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {user ? getInitials(user.name) : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-[#1e293b] dark:text-slate-100 text-sm truncate">
                  {user?.name ?? "Carregando..."}
                </p>
                <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[#64748b] dark:text-slate-400 text-xs truncate">
                  {user?.email ?? ""}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Sair"
                className="text-[#64748b] hover:text-[#ef4444] transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-[#e2e8f0] dark:border-slate-700 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#64748b] hover:text-[#1e293b]"
          >
            <Menu size={24} />
          </button>
          <span className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-[#1e293b] dark:text-slate-100 lg:hidden">
            Move On Board
          </span>
          <div className="hidden lg:block" />

          {/* Bell */}
          <div className="relative">
            <button
              onClick={() => setBellOpen((v) => !v)}
              title="Notificações"
              className="relative text-[#64748b] hover:text-[#4f46e5] dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[#ef4444] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-8 w-80 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <span className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-sm text-slate-800 dark:text-slate-100">
                    Notificações
                  </span>
                  <button onClick={() => setBellOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-6 font-['Plus_Jakarta_Sans',sans-serif]">
                      Nenhuma notificação
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 border-b border-slate-50 dark:border-slate-700 last:border-0">
                        <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {n.title}
                        </p>
                        <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {n.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
