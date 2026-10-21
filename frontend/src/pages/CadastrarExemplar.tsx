/**
 * B4 — Cadastrar exemplares (entrada no acervo).
 * O bibliotecário escolhe um livro JÁ cadastrado pelo Admin, a conservação e a
 * quantidade (pelo menos 1). Os exemplares entram na biblioteca do bibliotecário logado:
 * DISPONIVEL ou, se houver fila do título aqui, RESERVADO para o próximo da fila.
 */
import { useEffect, useMemo, useState } from "react";
import { api, nomeExemplar } from "../api/client";
import type { Exemplar, Livro } from "../types";
import { useUsuarioLogado } from "../auth/contexto";
import {
  Botao, Callout, Campo, CardResumo, Carregando, DuasColunas, Entrada, Erro,
  GrupoRadio, LinhaResumo, SectionCard, Sucesso, TituloPagina, Trilha,
} from "../components/ui";
import TabelaPaginada, { type Coluna } from "../components/TabelaPaginada";
import ModalConfirmacao, { ResumoModal } from "../components/ModalConfirmacao";

type Conservacao = "NOVO" | "BOM" | "USADO";

const ROTULO_CONSERVACAO: Record<Conservacao, string> = { NOVO: "Novo", BOM: "Bom", USADO: "Usado" };

export default function CadastrarExemplar() {
  const { bibliotecaNome } = useUsuarioLogado();
  const [livros, setLivros] = useState<Livro[] | null>(null);
  const [busca, setBusca] = useState("");
  const [livro, setLivro] = useState<Livro | null>(null);
  const [conservacao, setConservacao] = useState<Conservacao>("NOVO");
  const [quantidade, setQuantidade] = useState("1");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    api.get<Livro[]>("/livros").then(setLivros).catch((e) => setErro(e.message));
  }, []);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (livros ?? [])
      .filter(
        (l) =>
          !t ||
          l.titulo.toLowerCase().includes(t) ||
          l.autor.toLowerCase().includes(t) ||
          (l.isbn ?? "").toLowerCase().includes(t) ||
          (l.categoria?.nome ?? "").toLowerCase().includes(t),
      )
      .sort((a, b) => a.titulo.localeCompare(b.titulo));
  }, [livros, busca]);

  const qtd = Number(quantidade);
  const quantidadeValida = Number.isInteger(qtd) && qtd >= 1;

  async function cadastrar() {
    if (!livro) return;
    setEnviando(true);
    setErro("");
    setSucesso("");
    try {
      const criados = await api.post<Exemplar[]>("/exemplares", {
        livroId: livro.id,
        conservacao,
        quantidade: qtd,
      });
      const reservados = criados.filter((e) => e.status === "RESERVADO").length;
      setSucesso(
        `${criados.length} exemplar(es) de "${livro.titulo}" cadastrado(s) na ${bibliotecaNome}: ` +
          criados.map((e) => nomeExemplar(e.id)).join(", ") +
          "." +
          (reservados > 0
            ? ` ${reservados} já foi(ram) separado(s) para quem estava na fila deste título.`
            : ""),
      );
      setLivro(null);
      setQuantidade("1");
      setConservacao("NOVO");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
      setConfirmando(false);
    }
  }

  const colunas: Coluna<Livro>[] = [
    {
      titulo: "Título",
      render: (l) => (
        <div>
          <p className="font-semibold text-[#2c3e50]">{l.titulo}</p>
          <p className="text-[12px] text-[#66707d]">{l.autor}</p>
        </div>
      ),
    },
    { titulo: "Categoria", render: (l) => l.categoria?.nome ?? "—" },
    { titulo: "ISBN", render: (l) => l.isbn || "—" },
    {
      titulo: "Ação",
      className: "text-right",
      render: (l) =>
        livro?.id === l.id ? (
          <span className="text-[13px] font-semibold text-[#1976d2]">Selecionado</span>
        ) : (
          <Botao variante="secundario" className="!px-3 !py-[6px] !text-[13px]" onClick={() => setLivro(l)}>
            Selecionar
          </Botao>
        ),
    },
  ];

  if (livros === null && !erro) return <Carregando texto="Carregando catálogo..." />;

  return (
    <>
      <Trilha voltarPara="/biblioteca/emprestimo" itens={[{ rotulo: "Empréstimo", to: "/biblioteca/emprestimo" }, { rotulo: "Cadastrar exemplares" }]} />
      <TituloPagina
        titulo="Cadastrar Exemplares"
        subtitulo={`${bibliotecaNome ?? ""} · entrada de exemplares de livros já cadastrados no catálogo`}
      />

      {erro && <Erro mensagem={erro} />}
      {sucesso && <Sucesso mensagem={sucesso} />}

      <DuasColunas
        esquerda={
          <>
            <SectionCard titulo="1. Escolher o livro">
              <Entrada
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="🔎 Buscar por título, autor, ISBN ou categoria..."
                aria-label="Buscar livro do catálogo"
              />
              <div className="mt-4 -mx-6">
                <TabelaPaginada
                  dados={filtrados}
                  colunas={colunas}
                  chave={(l) => l.id}
                  porPagina={8}
                  textoVazio="Nenhum livro do catálogo corresponde a essa busca."
                />
              </div>
            </SectionCard>

            <SectionCard titulo="2. Dados dos exemplares">
              <p className="text-[13px] font-medium text-[#66707d] mb-2">Conservação</p>
              <GrupoRadio<Conservacao>
                valor={conservacao}
                onChange={setConservacao}
                opcoes={[
                  { valor: "NOVO", rotulo: "Novo" },
                  { valor: "BOM", rotulo: "Bom" },
                  { valor: "USADO", rotulo: "Usado" },
                ]}
              />
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo label="Quantidade">
                  <Entrada
                    type="number"
                    min={1}
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                  />
                </Campo>
                <Campo label="Biblioteca">
                  <Entrada value={bibliotecaNome ?? ""} readOnly />
                </Campo>
              </div>
            </SectionCard>
          </>
        }
        direita={
          <>
            <Callout tipo="info" titulo="Só livros do catálogo">
              Livros novos são cadastrados pelo administrador. Aqui você dá entrada nos
              exemplares da sua biblioteca.
            </Callout>
            <CardResumo
              titulo="Resumo do cadastro"
              rodape={
                <Botao
                  onClick={() => setConfirmando(true)}
                  disabled={!livro || !quantidadeValida || enviando}
                  className="w-full"
                >
                  📚 Cadastrar Exemplares
                </Botao>
              }
            >
              <LinhaResumo rotulo="Livro" valor={livro?.titulo ?? "—"} />
              <LinhaResumo rotulo="Conservação" valor={ROTULO_CONSERVACAO[conservacao]} />
              <LinhaResumo rotulo="Quantidade" valor={quantidadeValida ? String(qtd) : "—"} />
              <LinhaResumo rotulo="Biblioteca" valor={bibliotecaNome ?? "—"} />
            </CardResumo>
          </>
        }
      />

      <ModalConfirmacao
        aberto={confirmando}
        titulo="Cadastrar exemplares?"
        confirmarRotulo="Cadastrar"
        tom="verde"
        carregando={enviando}
        onConfirmar={cadastrar}
        onCancelar={() => setConfirmando(false)}
      >
        <ResumoModal
          linhas={[
            ["Livro", livro?.titulo ?? "—"],
            ["Quantidade", String(qtd)],
            ["Conservação", ROTULO_CONSERVACAO[conservacao]],
            ["Biblioteca", bibliotecaNome ?? "—"],
          ]}
        />
        <p>
          Se houver fila deste título na sua biblioteca, os novos exemplares já são
          separados para os primeiros da fila.
        </p>
      </ModalConfirmacao>
    </>
  );
}
