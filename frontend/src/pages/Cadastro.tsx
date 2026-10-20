/** Autocadastro público: cria um usuário da comunidade e já entra logado. */
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { TELA_INICIAL, useAuth } from "../auth/contexto";
import type { Sessao } from "../types";
import { Botao, Campo, Entrada, Erro } from "../components/ui";
import { TelaAcesso } from "./Login";

export default function Cadastro() {
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={TELA_INICIAL[usuario.perfil]} replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (!nome.trim() || !email.trim()) {
      setErro("Preencha o nome e o e-mail.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErro("A confirmação não confere com a senha.");
      return;
    }
    setEnviando(true);
    try {
      const sessao = await api.post<Sessao>("/auth/cadastro", {
        nome,
        email,
        senha,
      });
      entrar(sessao);
      navigate(TELA_INICIAL[sessao.usuario.perfil], { replace: true });
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaAcesso titulo="Criar conta">
      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <Campo label="Nome">
          <Entrada
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </Campo>
        <Campo label="E-mail">
          <Entrada
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Campo>
        <Campo label="Senha (mínimo 6 caracteres)">
          <Entrada
            type="password"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </Campo>
        <Campo label="Confirmar senha">
          <Entrada
            type="password"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
          />
        </Campo>
        {erro && <Erro mensagem={erro} />}
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Cadastrando..." : "Cadastrar"}
        </Botao>
      </form>
      <p className="text-center text-[14px] text-[#66707d]">
        Já tem conta?{" "}
        <Link
          to="/login"
          className="font-semibold text-[#1976d2] hover:underline"
        >
          Entrar
        </Link>
      </p>
    </TelaAcesso>
  );
}
