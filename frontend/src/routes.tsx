import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { PrivateRoute } from "./components/PrivateRoute";
import { Home } from "./pages/Home";
import { Projetos } from "./pages/Projetos";
import { BoardDetail } from "./pages/BoardDetail";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  // Rotas públicas
  { path: "/login", Component: Login },
  { path: "/registro", Component: Register },

  // Rotas privadas
  {
    Component: PrivateRoute,
    children: [
      {
        Component: Layout,
        children: [
          { path: "/", Component: Home },
          { path: "/projetos", Component: Projetos },
          { path: "/projetos/:boardId", Component: BoardDetail },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },

  // Redireciona qualquer coisa não mapeada para /
  { path: "/", element: <Navigate to="/" replace /> },
]);
