import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  Menu,
  X,
  Home,
  FolderKanban,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getInitials } from "../lib/utils";

const menuItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: FolderKanban, label: "Quadros", path: "/projetos" },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc]">
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
          w-[280px] bg-white border-r border-[#e2e8f0]
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-[#e2e8f0]">
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
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-[#1e293b] text-lg">
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
                          : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
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
          <div className="p-4 border-t border-[#e2e8f0]">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#f1f5f9] cursor-pointer transition-colors group">
              <div className="size-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {user ? getInitials(user.name) : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-[#1e293b] text-sm truncate">
                  {user?.name ?? "Carregando..."}
                </p>
                <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[#64748b] text-xs truncate">
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
        {/* Header mobile */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-[#e2e8f0]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#64748b] hover:text-[#1e293b]"
          >
            <Menu size={24} />
          </button>
          <span className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-[#1e293b]">
            Move On Board
          </span>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
