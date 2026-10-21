/** A7 — Categorias (só o Admin): listar, criar e editar. */
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { Categoria } from "../types";
import {
  AreaTexto, Botao, Campo, Carregando, Entrada, Erro, SectionCard, Sucesso,
  TituloPagina, Trilha,
} from "../components/ui";
import TabelaPaginada, { type Coluna } from "../components/TabelaPaginada";
import ModalConfirmacao, { ResumoModal } from "../components/ModalConfirmacao";

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [busca, setBusca] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function carregar() {
    api.get<Categoria[]>("/categorias").then(setCategorias).catch((e) => setErro(e.message));
  }
  useEffect(carregar, []);

  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (categorias ?? []).filter((c) => !t || c.nome.toLowerCase().includes(t));
  }, [categorias, busca]);

  function editar(c: Categoria) {
    setEditando(c);
    setNome(c.nome);
    setDescricao(c.descricao ?? "");
    setErro("");
    setSucesso("");
  }

  function limpar() {
    setEditando(null);
    setNome("");
    setDescricao("");
  }

  async function salvar() {
    setEnviando(true);
    setErro("");
    setSucesso("");
    try {
      const corpo = { nome, descricao };
      const c = editando
        ? await api.put<Categoria>(`/categorias/${editando.id}`, corpo)
        : await api.post<Categoria>("/categorias", corpo);
      setSucesso(editando ? `Categoria "${c.nome}" atualizada.` : `Categoria "${c.nome}" cadastrada.`);
      limpar();
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
      setConfirmando(false);
    }
  }

  const colunas: Coluna<Categoria>[] = [
    { titulo: "Nome", render: (c) => <span className="font-semibold text-[#2c3e50]">{c.nome}</span> },
    { titulo: "Descrição", render: (c) => c.descricao || "—" },
    {
      titulo: "Ação",
      className: "text-right",
      render: (c) => (
        <Botao variante="secundario" className="!px-3 !py-[6px] !text-[13px]" onClick={() => editar(c)}>
          Editar
        </Botao>
      ),
    },
  ];

  if (categorias === null && !erro) return <Carregando texto="Carregando categorias..." />;

  return (
    <>
      <Trilha voltarPara="/admin/catalogo" itens={[{ rotulo: "Categorias" }]} />
      <TituloPagina titulo="Categorias" subtitulo="Organize o catálogo da rede por categoria" />

      {erro && <Erro mensagem={erro} />}
      {sucesso && <Sucesso mensagem={sucesso} />}

      <SectionCard
        titulo={editando ? `Editar categoria: ${editando.nome}` : "Nova categoria"}
        acao={editando && <Botao variante="secundario" onClick={limpar}>Cancelar edição</Botao>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Campo label="Nome">
            <Entrada value={nome} onChange={(e) => setNome(e.target.value)} />
          </Campo>
          <Campo label="Descrição">
            <AreaTexto value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </Campo>
        </div>
        <div className="mt-5 flex justify-end">
          <Botao disabled={!nome.trim() || enviando} onClick={() => setConfirmando(true)}>
            {editando ? "Salvar alterações" : "Cadastrar categoria"}
          </Botao>
        </div>
      </SectionCard>

      <SectionCard titulo={`Categorias cadastradas (${filtradas.length})`}>
        <Entrada
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="🔎 Buscar categoria..."
          aria-label="Buscar categoria"
        />
        <div className="mt-4 -mx-6">
          <TabelaPaginada dados={filtradas} colunas={colunas} chave={(c) => c.id} textoVazio="Nenhuma categoria encontrada." />
        </div>
      </SectionCard>

      <ModalConfirmacao
        aberto={confirmando}
        titulo={editando ? "Salvar alterações da categoria?" : "Cadastrar categoria?"}
        confirmarRotulo={editando ? "Salvar" : "Cadastrar"}
        carregando={enviando}
        onConfirmar={salvar}
        onCancelar={() => setConfirmando(false)}
      >
        <ResumoModal linhas={[["Nome", nome], ["Descrição", descricao || "—"]]} />
      </ModalConfirmacao>
    </>
  );
}
