import { Link } from "react-router";
import { Home } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 px-4 text-center">
      <div className="text-[120px] font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#e2e8f0] leading-none mb-6">
        404
      </div>
      <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-[#1e293b] mb-2">
        Página não encontrada
      </h1>
      <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[#64748b] mb-8 max-w-sm">
        A página que você procura não existe ou foi movida.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 px-6 py-3 bg-[#4f46e5] text-white rounded-xl
                 font-['Plus_Jakarta_Sans',sans-serif] font-semibold hover:bg-[#4338ca]
                 transition-all shadow-lg shadow-[#4f46e5]/25"
      >
        <Home size={20} />
        Voltar ao Início
      </Link>
    </div>
  );
}
