/**
 * Guarda das rotas por perfil: sem sessão vai para /login; perfil errado
 * volta para a tela inicial do próprio perfil.
 */
import { Navigate, Outlet } from "react-router-dom";
import Layout from "../components/Layout";
import type { Perfil } from "../types";
import { TELA_INICIAL, useAuth } from "./contexto";

export default function RotaProtegida({ perfis }: { perfis: Perfil[] }) {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;
  if (!perfis.includes(usuario.perfil)) {
    return <Navigate to={TELA_INICIAL[usuario.perfil]} replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
