/**
 * Sessão do usuário: token + dados do usuário, guardados no localStorage.
 * Quando a API responde 401, a sessão é limpa e o usuário volta ao /login.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api, definirAoNaoAutorizado, lerSessao, salvarSessao } from "../api/client";
import type { Sessao, UsuarioSessao } from "../types";
import { AuthContext } from "./contexto";

/** Sessão salva ainda dentro do prazo do token (senão, descarta). */
function sessaoInicial(): Sessao | null {
  const s = lerSessao();
  if (!s?.token || !s.usuario || new Date(s.expiraEm).getTime() <= Date.now()) {
    salvarSessao(null);
    return null;
  }
  return s;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(sessaoInicial);
  const navigate = useNavigate();

  useEffect(() => {
    definirAoNaoAutorizado(() => {
      setSessao(null);
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  // Confere com o servidor o token que veio do localStorage
  // (adulterado ou expirado -> 401 -> o client limpa a sessão e vai ao /login).
  useEffect(() => {
    if (!lerSessao()) return;
    api
      .get<UsuarioSessao>("/auth/me")
      .then((usuario) =>
        setSessao((atual) => {
          if (!atual) return atual;
          const nova = { ...atual, usuario };
          salvarSessao(nova);
          return nova;
        }),
      )
      .catch(() => {});
  }, []);

  const entrar = useCallback((nova: Sessao) => {
    salvarSessao(nova);
    setSessao(nova);
  }, []);

  const sair = useCallback(() => {
    salvarSessao(null);
    setSessao(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const valor = useMemo(
    () => ({
      usuario: sessao?.usuario ?? null,
      token: sessao?.token ?? null,
      entrar,
      sair,
    }),
    [sessao, entrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
