/** Tela de login (e-mail + senha) dos usuários já cadastrados na base. */
import { useState, type FormEvent, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { TELA_INICIAL, useAuth } from "../auth/contexto";
import type { Sessao } from "../types";
import { Botao, Campo, Card, Entrada, Erro } from "../components/ui";

/** Moldura da tela de acesso, sem o menu do sistema. */
function TelaAcesso({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-[420px] p-8 flex flex-col gap-6">
        <div className="text-center">
          <p className="text-[22px] font-bold text-[#1976d2]">📚 Circula Book</p>
          <h1 className="mt-2 text-[18px] font-semibold text-[#2c3e50]">{titulo}</h1>
        </div>
        {children}
      </Card>
    </div>
  );
}

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={TELA_INICIAL[usuario.perfil]} replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (!email.trim() || !senha) {
      setErro("Informe o e-mail e a senha.");
      return;
    }
    setEnviando(true);
    try {
      const sessao = await api.post<Sessao>("/auth/login", { email, senha });
      entrar(sessao);
      navigate(TELA_INICIAL[sessao.usuario.perfil], { replace: true });
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaAcesso titulo="Entrar">
      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <Campo label="E-mail">
          <Entrada
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Campo>
        <Campo label="Senha">
          <Entrada
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </Campo>
        {erro && <Erro mensagem={erro} />}
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </Botao>
      </form>
    </TelaAcesso>
  );
}
