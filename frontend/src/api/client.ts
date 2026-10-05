/**
 * Cliente HTTP único do app.
 *
 * O Vite está configurado (vite.config.ts) para redirecionar /api
 * para http://localhost:8080, então basta usar caminhos relativos.
 *
 * Toda requisição leva o token da sessão (Authorization: Bearer). Um 401
 * fora do login significa sessão inválida ou expirada: a sessão é
 * limpa e o AuthContext manda o usuário para /login.
 */
import type { Sessao } from "../types";

const BASE = "/api";
const CHAVE_SESSAO = "circulabook.sessao";

/** Lê a sessão salva no localStorage (null se ausente ou corrompida). */
export function lerSessao(): Sessao | null {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    return bruto ? (JSON.parse(bruto) as Sessao) : null;
  } catch {
    return null;
  }
}

export function salvarSessao(sessao: Sessao | null) {
  if (sessao) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  else localStorage.removeItem(CHAVE_SESSAO);
}

let aoNaoAutorizado: () => void = () => {};

/** O AuthContext registra aqui o que fazer quando a API responde 401. */
export function definirAoNaoAutorizado(fn: () => void) {
  aoNaoAutorizado = fn;
}

/** O login é público: não leva token e o 401 é só mensagem de erro. */
const ROTAS_PUBLICAS = ["/auth/login"];

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const publica = ROTAS_PUBLICAS.includes(path);
  const token = publica ? null : lerSessao()?.token;
  const resp = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (resp.status === 401 && !publica) {
    salvarSessao(null);
    aoNaoAutorizado();
    throw new Error("Sua sessão expirou. Faça login novamente.");
  }

  if (!resp.ok) {
    // O backend devolve a mensagem de erro em texto puro no badRequest()
    const texto = await resp.text();
    throw new Error(texto || `Falha na requisição (${resp.status})`);
  }

  if (resp.status === 204) return undefined as T;

  const corpo = await resp.text();
  return corpo ? (JSON.parse(corpo) as T) : (undefined as T);
}

export const api = {
  get:   <T>(path: string) => request<T>(path),
  post:  <T>(path: string, body?: unknown) =>
           request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
           request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  put:   <T>(path: string, body?: unknown) =>
           request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
};

/** Monta querystring ignorando campos vazios. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      p.append(k, String(v));
    }
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** O exemplar é identificado pelo número sequencial (id). */
export function nomeExemplar(id: number): string {
  return `Exemplar nº ${id}`;
}

/** Formata ISO date-time do Java para dd/mm/aaaa. */
export function formatarData(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

/** Dias de atraso entre a data prevista e hoje (0 se estiver em dia). */
export function diasDeAtraso(dataPrevista?: string | null): number {
  if (!dataPrevista) return 0;
  const prev = new Date(dataPrevista).getTime();
  const hoje = Date.now();
  if (hoje <= prev) return 0;
  return Math.floor((hoje - prev) / (1000 * 60 * 60 * 24));
}
