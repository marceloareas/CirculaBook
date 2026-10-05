import { createContext, useContext } from "react";
import type { Perfil, Sessao, UsuarioSessao } from "../types";

export interface Auth {
  usuario: UsuarioSessao | null;
  token: string | null;
  entrar: (sessao: Sessao) => void;
  sair: () => void;
}

export const AuthContext = createContext<Auth | null>(null);

export function useAuth(): Auth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return ctx;
}

/** Usuário da sessão em telas que só abrem logado (dentro de RotaProtegida). */
export function useUsuarioLogado(): UsuarioSessao {
  const { usuario } = useAuth();
  if (!usuario) throw new Error("Tela protegida aberta sem sessão.");
  return usuario;
}

/** Tela inicial de cada perfil, pós-login. */
export const TELA_INICIAL: Record<Perfil, string> = {
  COMUM: "/",
  BIBLIOTECARIO: "/biblioteca/emprestimo",
};

export const NOME_PERFIL: Record<Perfil, string> = {
  COMUM: "Usuário da Comunidade",
  BIBLIOTECARIO: "Bibliotecário",
};
