/**
 * TELA 4 — Registrar Empréstimo (UC09).
 * Três passos: identificar o usuário, escolher o exemplar e confirmar.
 * O prazo é fixo (14 dias corridos) e calculado pelo servidor.
 * A coluna direita mostra em tempo real se o usuário está apto (limite e bloqueio).
 */
import { useEffect, useMemo, useState } from "react";
import { api, nomeExemplar, formatarData } from "../api/client";
import type { Emprestimo, Exemplar, SituacaoUsuario, Usuario } from "../types";
import {
  Badge,
  Botao,
  Campo,
  CardResumo,
  Callout,
  Carregando,
  DuasColunas,
  Entrada,
  Erro,
  LinhaResumo,
  SectionCard,
  Sucesso,
  TituloPagina,
} from "../components/ui";
import ModalConfirmacao, { ResumoModal } from "../components/ModalConfirmacao";
import { useUsuarioLogado } from "../auth/contexto";
import TabelaPaginada, { type Coluna } from "../components/TabelaPaginada";

// Só para exibição: o prazo vale pelo backend (EmprestimoService.PRAZO_EMPRESTIMO_DIAS)
const PRAZO_EMPRESTIMO_DIAS = 14;

export default function RegistrarEmprestimo() {
  const { bibliotecaId, bibliotecaNome } = useUsuarioLogado();
  const [exemplares, setExemplares] = useState<Exemplar[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [buscaUsuario, setBuscaUsuario] = useState("");
  const [usuarioSel, setUsuarioSel] = useState<Usuario | null>(null);
  const [situacao, setSituacao] = useState<SituacaoUsuario | null>(null);

  const [buscaExemplar, setBuscaExemplar] = useState("");
  const [exemplarSel, setExemplarSel] = useState<Exemplar | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);

  function carregarAcervo() {
    return api
      .get<Exemplar[]>(`/exemplares/biblioteca/${bibliotecaId}`)
      .then((lista) => {
        setExemplares(lista);
        return lista;
      });
  }

  useEffect(() => {
    Promise.all([
      carregarAcervo(),
      api.get<Usuario[]>("/usuarios/comuns"),
    ])
      .then(([, comuns]) => setUsuarios(comuns))
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
    // carga única ao abrir a tela (a biblioteca da sessão não muda aqui)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!usuarioSel) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSituacao(null);
      return;
    }
    api
      .get<SituacaoUsuario>(`/emprestimos/situacao/${usuarioSel.id}`)
      .then(setSituacao)
      .catch((e) => setErro(e.message));
  }, [usuarioSel]);

  const emprestaveis = useMemo(
    () =>
      exemplares.filter(
        (e) => e.status === "DISPONIVEL" || e.status === "RESERVADO",
      ),
    [exemplares],
  );

  const sugestoesUsuario = useMemo(() => {
    const termo = buscaUsuario.trim().toLowerCase();
    if (termo.length < 2) return [];
    return usuarios
      .filter(
        (u) =>
          u.nome.toLowerCase().includes(termo) ||
          u.email.toLowerCase().includes(termo),
      )
      .slice(0, 5);
  }, [usuarios, buscaUsuario]);

  const exemplaresFiltrados = useMemo(() => {
    const termo = buscaExemplar.trim().toLowerCase();
    if (!termo) return emprestaveis;
    return emprestaveis.filter(
      (e) =>
        e.livro.titulo.toLowerCase().includes(termo) ||
        e.livro.autor.toLowerCase().includes(termo) ||
        (e.livro.categoria?.nome ?? "").toLowerCase().includes(termo),
    );
  }, [emprestaveis, buscaExemplar]);

  // eslint-disable-next-line react-hooks/purity
  const devolucaoPrevista = new Date(Date.now() + PRAZO_EMPRESTIMO_DIAS * 86_400_000);
  const podeConfirmar =
    !!exemplarSel && !!usuarioSel && situacao?.apto === true && !enviando;

  async function confirmar() {
    if (!exemplarSel || !usuarioSel) return;
    setEnviando(true);
    setErro("");
    setSucesso("");
    try {
      const emp = await api.post<Emprestimo>("/emprestimos/registrar", {
        exemplarId: exemplarSel.id,
        usuarioId: usuarioSel.id,
      });
      setSucesso(
        `Empréstimo registrado: ${emp.exemplar.livro.titulo} para ${emp.usuario.nome}, ` +
          `devolução prevista em ${formatarData(emp.dataPrevDevolucao)}.`,
      );
      setExemplarSel(null);
      setUsuarioSel(null);
      setBuscaUsuario("");
      setBuscaExemplar("");
      carregarAcervo().catch(() => {});
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return <Carregando texto="Carregando acervo..." />;

  const colunas: Coluna<Exemplar>[] = [
    {
      titulo: "Exemplar",
      render: (e) => (
        <span className="text-[13px] whitespace-nowrap">
          {nomeExemplar(e.id)}
        </span>
      ),
    },
    {
      titulo: "Título",
      render: (e) => (
        <div>
          <p className="font-semibold text-[#2c3e50]">{e.livro.titulo}</p>
          <p className="text-[12px] text-[#66707d]">{e.livro.autor}</p>
        </div>
      ),
    },
    { titulo: "Categoria", render: (e) => e.livro.categoria?.nome ?? "—" },
    {
      titulo: "Status",
      render: (e) =>
        e.status === "DISPONIVEL" ? (
          <Badge tom="verde">🟢 Disponível</Badge>
        ) : (
          <Badge tom="amarelo">🟡 Reservado</Badge>
        ),
    },
    {
      titulo: "Ação",
      className: "text-right",
      render: (e) =>
        exemplarSel?.id === e.id ? (
          <Badge tom="azul">✔ Selecionado</Badge>
        ) : (
          <Botao variante="secundario" onClick={() => setExemplarSel(e)}>
            Selecionar
          </Botao>
        ),
    },
  ];

  return (
    <>
      <TituloPagina
        titulo="Registrar Empréstimo"
        subtitulo={`${bibliotecaNome ?? ""} · identifique o usuário, escolha o exemplar e confirme`}
      />

      {erro && <Erro mensagem={erro} />}
      {sucesso && <Sucesso mensagem={sucesso} />}

      <DuasColunas
        esquerda={
          <>
            <SectionCard titulo="1. Identificar o usuário">
              {!usuarioSel ? (
                <>
                  <Campo label="Nome ou e-mail do usuário">
                    <Entrada
                      value={buscaUsuario}
                      onChange={(e) => setBuscaUsuario(e.target.value)}
                      placeholder="🔎 Digite ao menos 2 letras..."
                    />
                  </Campo>
                  {sugestoesUsuario.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {sugestoesUsuario.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setUsuarioSel(u)}
                          className="flex items-center gap-3 rounded-[10px] bg-[#f5f7fa] p-3 text-left hover:bg-[#e8f0fc] transition-colors"
                        >
                          <span aria-hidden className="text-[24px]">
                            👤
                          </span>
                          <div>
                            <p className="text-[14px] font-semibold text-[#2c3e50]">
                              {u.nome}
                            </p>
                            <p className="text-[12px] text-[#66707d]">
                              {u.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {buscaUsuario.trim().length >= 2 &&
                    sugestoesUsuario.length === 0 && (
                      <p className="mt-3 text-[13px] text-[#66707d]">
                        Nenhum usuário encontrado.
                      </p>
                    )}
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-4 rounded-[10px] bg-[#f5f7fa] p-4">
                  <span aria-hidden className="text-[30px]">
                    👤
                  </span>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[15px] font-semibold text-[#2c3e50]">
                      {usuarioSel.nome}
                    </p>
                    <p className="text-[13px] text-[#66707d]">
                      {usuarioSel.email}
                      {situacao &&
                        ` · Empréstimos ativos: ${situacao.emprestimosAtivos}/${situacao.limite}`}
                    </p>
                  </div>
                  {situacao &&
                    (situacao.apto ? (
                      <Badge tom="verde">🟢 Regular</Badge>
                    ) : (
                      <Badge tom="vermelho">🔴 Impedido</Badge>
                    ))}
                  <Botao
                    variante="secundario"
                    onClick={() => {
                      setUsuarioSel(null);
                      setBuscaUsuario("");
                    }}
                  >
                    Trocar
                  </Botao>
                </div>
              )}
            </SectionCard>

            <SectionCard titulo="2. Escolher o exemplar">
              {exemplarSel && (
                <div className="flex flex-wrap items-center gap-4 rounded-[10px] border border-[#1976d2] bg-[#e8f0fc] p-4">
                  <span aria-hidden className="text-[26px]">
                    📕
                  </span>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[15px] font-semibold text-[#2c3e50]">
                      {exemplarSel.livro.titulo} — {exemplarSel.livro.autor}
                    </p>
                    <p className="text-[13px] text-[#66707d]">
                      {nomeExemplar(exemplarSel.id)}
                    </p>
                  </div>
                  <Botao
                    variante="secundario"
                    onClick={() => setExemplarSel(null)}
                  >
                    Remover
                  </Botao>
                </div>
              )}

              <div className="mt-5 -mx-6 border-t border-[#e0e0e0]">
                <div className="px-6 py-4">
                  <Entrada
                    value={buscaExemplar}
                    onChange={(e) => setBuscaExemplar(e.target.value)}
                    placeholder="🔎 Busque por título, autor ou categoria..."
                  />
                  <p className="mt-2 text-[12px] text-[#66707d]">
                    Mostrando apenas exemplares da sua biblioteca (
                    {emprestaveis.length} para empréstimo).
                  </p>
                </div>
                <TabelaPaginada
                  key={buscaExemplar}
                  dados={exemplaresFiltrados}
                  colunas={colunas}
                  chave={(e) => e.id}
                  porPagina={6}
                  classeLinha={(e) =>
                    exemplarSel?.id === e.id ? "bg-[#e8f0fc]" : ""
                  }
                  textoVazio="Nenhum exemplar disponível corresponde a essa busca."
                />
              </div>
            </SectionCard>

            <SectionCard titulo="3. Prazo do empréstimo">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Campo label="Data do empréstimo">
                  <Entrada
                    value={new Date().toLocaleDateString("pt-BR")}
                    readOnly
                  />
                </Campo>
                <Campo label="Prazo">
                  <Entrada value={`${PRAZO_EMPRESTIMO_DIAS} dias corridos`} readOnly />
                </Campo>
                <Campo label="Devolução prevista">
                  <Entrada
                    value={devolucaoPrevista.toLocaleDateString("pt-BR")}
                    readOnly
                  />
                </Campo>
              </div>
            </SectionCard>
          </>
        }
        direita={
          <>
            {situacao?.apto && (
              <Callout tipo="sucesso" titulo="Nenhuma pendência encontrada">
                O usuário está apto a realizar este empréstimo.
              </Callout>
            )}
            {situacao && !situacao.apto && (
              <Callout tipo="aviso" titulo="Empréstimo bloqueado">
                {situacao.motivo}
              </Callout>
            )}

            <Callout tipo="info" titulo="Limite de empréstimos">
              Máximo de {situacao?.limite ?? 3} exemplares de títulos distintos
              simultaneamente
              {situacao &&
                ` — ${situacao.nome.split(" ")[0]} está usando ${situacao.emprestimosAtivos} de ${situacao.limite}`}
              .
            </Callout>

            <Callout
              tipo="aviso"
              titulo="Atraso bloqueia novos empréstimos"
            >
              Cada dia de atraso soma 2 dias de bloqueio para novos empréstimos.
            </Callout>

            <CardResumo
              titulo="Resumo do empréstimo"
              rodape={
                <Botao
                  variante="verde"
                  onClick={() => setModalAberto(true)}
                  disabled={!podeConfirmar}
                  className="w-full"
                >
                  {enviando ? "Registrando..." : "✅ Confirmar Empréstimo"}
                </Botao>
              }
            >
              <LinhaResumo
                rotulo="Livro"
                valor={exemplarSel?.livro.titulo ?? "—"}
              />
              <LinhaResumo rotulo="Usuário" valor={usuarioSel?.nome ?? "—"} />
              <LinhaResumo
                rotulo="Devolução prevista"
                valor={devolucaoPrevista.toLocaleDateString("pt-BR")}
              />
            </CardResumo>
          </>
        }
      />

      <ModalConfirmacao
        aberto={modalAberto}
        titulo="Confirmar empréstimo?"
        confirmarRotulo="Confirmar empréstimo"
        tom="verde"
        carregando={enviando}
        onConfirmar={async () => {
          await confirmar();
          setModalAberto(false);
        }}
        onCancelar={() => setModalAberto(false)}
      >
        <ResumoModal
          linhas={[
            ["Livro", exemplarSel?.livro.titulo ?? "—"],
            ["Exemplar", exemplarSel ? nomeExemplar(exemplarSel.id) : "—"],
            ["Usuário", usuarioSel?.nome ?? "—"],
            ["Prazo", `${PRAZO_EMPRESTIMO_DIAS} dias corridos`],
            [
              "Devolução prevista",
              devolucaoPrevista.toLocaleDateString("pt-BR"),
            ],
          ]}
        />
      </ModalConfirmacao>
    </>
  );
}
