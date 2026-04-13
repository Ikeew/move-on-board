import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#4f46e5] rounded-2xl size-14 flex items-center justify-center mb-4 shadow-lg shadow-[#4f46e5]/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-8"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="3" width="7" height="18" rx="2" fill="white" fillOpacity="0.9" />
              <rect x="14" y="3" width="7" height="10" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="14" y="17" width="7" height="4" rx="2" fill="white" fillOpacity="0.6" />
            </svg>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-[#1e293b]">
            Move On Board
          </h1>
          <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[#64748b] mt-1">
            Entre na sua conta
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-medium text-[#475569] block mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#cbd5e1]
                         font-['Plus_Jakarta_Sans',sans-serif] text-[#1e293b]
                         focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent
                         transition-all placeholder:text-[#94a3b8]"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-medium text-[#475569] block mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#cbd5e1]
                           font-['Plus_Jakarta_Sans',sans-serif] text-[#1e293b]
                           focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent
                           transition-all placeholder:text-[#94a3b8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#4f46e5] text-white rounded-xl
                       font-['Plus_Jakarta_Sans',sans-serif] font-semibold
                       hover:bg-[#4338ca] disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all shadow-lg shadow-[#4f46e5]/25 hover:shadow-xl hover:shadow-[#4f46e5]/30"
            >
              {loading ? (
                <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Link para registro */}
        <p className="text-center mt-6 font-['Plus_Jakarta_Sans',sans-serif] text-[#64748b] text-sm">
          Não tem uma conta?{" "}
          <Link
            to="/registro"
            className="text-[#4f46e5] font-semibold hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
