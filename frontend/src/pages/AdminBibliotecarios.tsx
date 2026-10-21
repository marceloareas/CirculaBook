/**
 * A6 — Bibliotecários (só o Admin): listar, cadastrar e ativar/desativar.
 * Todo cadastro aqui é BIBLIOTECARIO, com biblioteca obrigatória e senha inicial.
 * Usuários da comunidade se cadastram sozinhos na tela de login.
 */
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { Biblioteca, Usuario } from "../types";
import {
  Badge, Botao, Campo, Carregando, Entrada, Erro, SectionCard, Selecao,
  Sucesso, TituloPagina, Trilha,
} from "../components/ui";
import TabelaPaginada, { type Coluna } from "../components/TabelaPaginada";
import ModalConfirmacao, { ResumoModal } from "../components/ModalConfirmacao";

type Pendente = { tipo: "criar" } | { tipo: "ativar" | "desativar"; usuario: Usuario };

export default function AdminBibliotecarios() {
  const [bibliotecarios, setBibliotecarios] = useState<Usuario[] | null>(null);
  const [bibliotecas, setBibliotecas] = useState<Biblioteca[]>([]);
  const [busca, setBusca] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [bibliotecaId, setBibliotecaId] = useState("");
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function carregar() {
    Promise.all([
      api.get<Usuario[]>("/usuarios/bibliotecarios"),
      api.get<Biblioteca[]>("/bibliotecas"),
    ])
      .then(([u, b]) => {
        setBibliotecarios(u);
        setBibliotecas(b);
      })
      .catch((e) => setErro(e.message));
  }
  useEffect(carregar, []);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (bibliotecarios ?? [])
      .filter(
        (u) =>
          !t ||
          u.nome.toLowerCase().includes(t) ||
          u.email.toLowerCase().includes(t) ||
          (u.biblioteca?.nome ?? "").toLowerCase().includes(t),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [bibliotecarios, busca]);

  const nomeBiblioteca = bibliotecas.find((b) => String(b.id) === bibliotecaId)?.nome ?? "—";

  async function confirmar() {
    if (!pendente) return;
    setEnviando(true);
    setErro("");
    setSucesso("");
    try {
      if (pendente.tipo === "criar") {
        const u = await api.post<Usuario>("/usuarios/bibliotecarios", {
          nome,
          email,
          senha,
          bibliotecaId: bibliotecaId ? Number(bibliotecaId) : null,
        });
        setSucesso(`${u.nome} cadastrado(a) como bibliotecário(a) da ${u.biblioteca?.nome}. Já pode entrar com a senha inicial.`);
        setNome("");
        setEmail("");
        setSenha("");
        setBibliotecaId("");
      } else {
        const u = await api.patch<Usuario>(`/usuarios/bibliotecarios/${pendente.usuario.id}/${pendente.tipo}`);
        setSucesso(pendente.tipo === "desativar" ? `${u.nome} foi desativado(a).` : `${u.nome} foi reativado(a).`);
      }
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
      setPendente(null);
    }
  }

  const colunas: Coluna<Usuario>[] = [
    {
      titulo: "Bibliotecário",
      render: (u) => (
        <div>
          <p className="font-semibold text-[#2c3e50]">{u.nome}</p>
          <p className="text-[12px] text-[#66707d]">{u.email}</p>
        </div>
      ),
    },
    { titulo: "Biblioteca", render: (u) => u.biblioteca?.nome ?? "—" },
    {
      titulo: "Situação",
      render: (u) => (u.ativo ? <Badge tom="verde">Ativo</Badge> : <Badge tom="cinza">Inativo</Badge>),
    },
    {
      titulo: "Ação",
      className: "text-right",
      render: (u) =>
        u.ativo ? (
          <Botao variante="perigo" className="!px-3 !py-[6px] !text-[13px]"
                 onClick={() => setPendente({ tipo: "desativar", usuario: u })}>
            Desativar
          </Botao>
        ) : (
          <Botao variante="secundario" className="!px-3 !py-[6px] !text-[13px]"
                 onClick={() => setPendente({ tipo: "ativar", usuario: u })}>
            Reativar
          </Botao>
        ),
    },
  ];

  if (bibliotecarios === null && !erro) return <Carregando texto="Carregando bibliotecários..." />;

  const podeCriar = nome.trim() && email.trim() && senha.length >= 6 && bibliotecaId && !enviando;

  return (
    <>
      <Trilha voltarPara="/admin/catalogo" itens={[{ rotulo: "Bibliotecários" }]} />
      <TituloPagina titulo="Bibliotecários" subtitulo="Cada bibliotecário opera somente a própria biblioteca" />

      {erro && <Erro mensagem={erro} />}
      {sucesso && <Sucesso mensagem={sucesso} />}

      <SectionCard titulo="Novo bibliotecário">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Campo label="Nome">
            <Entrada value={nome} onChange={(e) => setNome(e.target.value)} />
          </Campo>
          <Campo label="E-mail">
            <Entrada type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Campo>
          <Campo label="Senha inicial (mínimo 6 caracteres)">
            <Entrada type="password" autoComplete="new-password" value={senha}
                     onChange={(e) => setSenha(e.target.value)} />
          </Campo>
          <Campo label="Biblioteca">
            <Selecao value={bibliotecaId} onChange={(e) => setBibliotecaId(e.target.value)}>
              <option value="">Selecione a biblioteca...</option>
              {bibliotecas.map((b) => (
                <option key={b.id} value={b.id}>{b.nome}</option>
              ))}
            </Selecao>
          </Campo>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-end gap-4">
          <Botao disabled={!podeCriar} onClick={() => setPendente({ tipo: "criar" })}>
            Cadastrar bibliotecário
          </Botao>
        </div>
      </SectionCard>

      <SectionCard titulo={`Bibliotecários da rede (${filtrados.length})`}>
        <Entrada
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="🔎 Buscar por nome, e-mail ou biblioteca..."
          aria-label="Buscar bibliotecário"
        />
        <div className="mt-4 -mx-6">
          <TabelaPaginada dados={filtrados} colunas={colunas} chave={(u) => u.id} textoVazio="Nenhum bibliotecário encontrado." />
        </div>
      </SectionCard>

      <ModalConfirmacao
        aberto={!!pendente}
        titulo={
          pendente?.tipo === "criar" ? "Cadastrar bibliotecário?"
            : pendente?.tipo === "desativar" ? "Desativar bibliotecário?" : "Reativar bibliotecário?"
        }
        confirmarRotulo={pendente?.tipo === "desativar" ? "Desativar" : "Confirmar"}
        tom={pendente?.tipo === "desativar" ? "perigo" : "normal"}
        carregando={enviando}
        onConfirmar={confirmar}
        onCancelar={() => setPendente(null)}
      >
        {pendente?.tipo === "criar" ? (
          <ResumoModal linhas={[["Nome", nome], ["E-mail", email], ["Biblioteca", nomeBiblioteca]]} />
        ) : pendente ? (
          <p>
            {pendente.tipo === "desativar"
              ? `${pendente.usuario.nome} não conseguirá mais entrar no sistema.`
              : `${pendente.usuario.nome} poderá voltar a entrar no sistema.`}
          </p>
        ) : null}
      </ModalConfirmacao>
    </>
  );
}
