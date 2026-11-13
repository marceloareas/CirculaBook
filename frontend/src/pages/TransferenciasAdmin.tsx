/**
 * Transferências — Administração da Rede (A2 e A3).
 *
 *  - Pedidos aguardando decisão (GET /transferencias/pedidos-pendentes): o título vem
 *    do pedido mesmo sem exemplar; mostra se o exemplar já está separado e se a origem
 *    ainda pode ceder o livro (nenhuma biblioteca fica sem o título).
 *  - Transferência avulsa em lote: vários exemplares disponíveis da rede para um destino,
 *    tudo ou nada.
 *  - Acompanhamento paginado com filtro por situação.
 * O Admin não confirma chegada: isso é do bibliotecário do destino.
 */
import { useEffect, useMemo, useState } from "react";
import { api, formatarData, nomeExemplar, todasAsPaginas } from "../api/client";
import type {
  DestinoRetirada,
  Exemplar,
  PedidoPendente,
  ResumoTransferencias,
  SolicitacaoTransferencia,
  TransferenciaResumo,
} from "../types";
import {
  AreaTexto,
  BadgeEtapaTransferencia,
  Botao,
  Callout,
  Campo,
  CapaLivro,
  CardResumo,
  Carregando,
  DuasColunas,
  Entrada,
  Erro,
  LinhaResumo,
  SectionCard,
  Selecao,
  Sucesso,
  TituloPagina,
  Trilha,
  Vazio,
} from "../components/ui";
import ModalConfirmacao, { ResumoModal } from "../components/ModalConfirmacao";
import TabelaPaginada, { type Coluna } from "../components/TabelaPaginada";

type Decisao = { p: PedidoPendente; acao: "aprovar" | "rejeitar" };

const FILTROS: { valor: string; rotulo: string }[] = [
  { valor: "", rotulo: "Todas" },
  { valor: "PENDENTE", rotulo: "Aguardando decisão" },
  { valor: "APROVADA_AGUARDANDO_EXEMPLAR", rotulo: "Aprovadas, aguardando exemplar" },
  { valor: "EM_TRANSITO", rotulo: "Em trânsito" },
  { valor: "CONCLUIDA", rotulo: "Concluídas" },
  { valor: "REJEITADA", rotulo: "Rejeitadas" },
  { valor: "CANCELADA", rotulo: "Canceladas" },
];

/** Texto da capacidade da origem, sem jargão. */
function capacidade(p: PedidoPendente): string {
  const { total, abertas } = p.rn15;
  return `A ${p.origem.nome} tem ${total} exemplar(es) deste título e ${abertas} outra(s) transferência(s) em andamento: pode ceder este.`;
}

export default function TransferenciasAdmin() {
  const [pendentes, setPendentes] = useState<PedidoPendente[] | null>(null);
  const [acompanhamento, setAcompanhamento] = useState<TransferenciaResumo[] | null>(null);
  const [filtro, setFiltro] = useState("");
  const [resumo, setResumo] = useState<ResumoTransferencias | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [decisao, setDecisao] = useState<Decisao | null>(null);
  const [motivo, setMotivo] = useState("");
  const [processando, setProcessando] = useState(false);

  // Avulsa em lote
  const [avulsaAberta, setAvulsaAberta] = useState(false);
  const [exemplares, setExemplares] = useState<Exemplar[] | null>(null);
  const [destinos, setDestinos] = useState<DestinoRetirada[]>([]);
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [destinoId, setDestinoId] = useState("");
  const [obs, setObs] = useState("");
  const [confirmandoAvulsa, setConfirmandoAvulsa] = useState(false);
  const [erroAvulsa, setErroAvulsa] = useState("");

  function carregar() {
    Promise.all([
      api.get<PedidoPendente[]>("/transferencias/pedidos-pendentes"),
      api.get<ResumoTransferencias>("/transferencias/resumo"),
    ])
      .then(([p, r]) => {
        setPendentes(p);
        setResumo(r);
      })
      .catch((e) => setErro(e.message));
  }
  useEffect(carregar, []);

  useEffect(() => {
    let ativo = true;
    todasAsPaginas<TransferenciaResumo>("/transferencias/acompanhamento", { status: filtro })
      .then((l) => ativo && setAcompanhamento(l))
      .catch((e) => ativo && setErro((e as Error).message));
    return () => {
      ativo = false;
    };
  }, [filtro, resumo]);

  function carregarAvulsa() {
    Promise.all([
      api.get<Exemplar[]>("/exemplares"),
      api.get<DestinoRetirada[]>("/transferencias/destinos-avulsa"),
    ])
      .then(([ex, d]) => {
        setExemplares(ex.filter((e) => e.status === "DISPONIVEL"));
        setDestinos(d);
      })
      .catch((e) => setErroAvulsa(e.message));
  }

  function abrirAvulsa() {
    setAvulsaAberta(true);
    setErroAvulsa("");
    carregarAvulsa();
  }

  function fecharAvulsa() {
    setAvulsaAberta(false);
    setSelecionados([]);
    setDestinoId("");
    setObs("");
    setBusca("");
    setErroAvulsa("");
  }

  async function decidir() {
    if (!decisao) return;
    const { p, acao } = decisao;
    setProcessando(true);
    setErro("");
    setSucesso("");
    try {
      const params =
        acao === "rejeitar" && motivo.trim()
          ? `?motivo=${encodeURIComponent(motivo.trim())}`
          : "";
      const r = await api.patch<SolicitacaoTransferencia>(
        `/transferencias/${p.id}/${acao}${params}`,
      );
      setSucesso(
        acao === "rejeitar"
          ? `Pedido de "${p.titulo}" rejeitado. A reserva de ${p.solicitante.nome} continua na fila da ${p.origem.nome}, com retirada lá.`
          : r.status === "EM_TRANSITO"
            ? `Pedido de "${p.titulo}" aprovado: o ${nomeExemplar(p.exemplarId!)} já está a caminho da ${p.destino.nome}.`
            : `Pedido de "${p.titulo}" aprovado. Ele segue para a ${p.destino.nome} quando um exemplar for devolvido na ${p.origem.nome}.`,
      );
      carregar();
    } catch (e) {
      setErro((e as Error).message);
      carregar();
    } finally {
      setDecisao(null);
      setProcessando(false);
    }
  }

  async function criarAvulsa() {
    setProcessando(true);
    setErroAvulsa("");
    setSucesso("");
    try {
      const criadas = await api.post<SolicitacaoTransferencia[]>("/transferencias/avulsa", {
        exemplarIds: selecionados,
        bibliotecaDestinoId: Number(destinoId),
        observacoes: obs.trim() || undefined,
      });
      setSucesso(
        `${criadas.length} transferência(s) avulsa(s) criada(s) para a ${destinoSel?.nome}; os exemplares já estão em trânsito.`,
      );
      fecharAvulsa();
      carregar();
    } catch (e) {
      // Tudo ou nada: nada foi criado, a seleção continua para corrigir
      setErroAvulsa((e as Error).message);
    } finally {
      setConfirmandoAvulsa(false);
      setProcessando(false);
    }
  }

  const exemplaresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = exemplares ?? [];
    if (!termo) return lista;
    return lista.filter(
      (e) =>
        e.livro.titulo.toLowerCase().includes(termo) ||
        e.livro.autor.toLowerCase().includes(termo) ||
        e.biblioteca.nome.toLowerCase().includes(termo) ||
        String(e.id) === termo.replace(/\D/g, ""),
    );
  }, [exemplares, busca]);

  const escolhidos = (exemplares ?? []).filter((e) => selecionados.includes(e.id));
  const destinoSel = destinos.find((d) => String(d.bibliotecaId) === destinoId);
  const bloqueados = destinos.filter((d) => !d.permitido);

  function alternar(id: number) {
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const colunasExemplar: Coluna<Exemplar>[] = [
    {
      titulo: "Sel.",
      render: (e) => (
        <input
          type="checkbox"
          aria-label={`Selecionar ${nomeExemplar(e.id)}`}
          checked={selecionados.includes(e.id)}
          onChange={() => alternar(e.id)}
        />
      ),
    },
    { titulo: "Exemplar", render: (e) => nomeExemplar(e.id) },
    {
      titulo: "Livro",
      render: (e) => (
        <div>
          <p className="font-semibold text-[#2c3e50]">{e.livro.titulo}</p>
          <p className="text-[12px] text-[#66707d]">{e.livro.autor}</p>
        </div>
      ),
    },
    { titulo: "Biblioteca atual", render: (e) => e.biblioteca.nome },
  ];

  const colunasAcompanhamento: Coluna<TransferenciaResumo>[] = [
    { titulo: "Nº", render: (t) => `#${t.id}` },
    {
      titulo: "Livro",
      render: (t) => (
        <div>
          <p className="font-semibold text-[#2c3e50]">{t.titulo}</p>
          <p className="text-[12px] text-[#66707d]">
            {t.exemplarId ? nomeExemplar(t.exemplarId) : "Exemplar ainda não vinculado"}
          </p>
        </div>
      ),
    },
    {
      titulo: "Trajeto",
      render: (t) => (
        <span className="text-[13px]">
          {t.origem.nome} → {t.destino.nome}
        </span>
      ),
    },
    {
      titulo: "Origem do pedido",
      render: (t) =>
        t.tipo === "AVULSA"
          ? "Avulsa (administrador)"
          : `Reserva de ${t.solicitante?.nome ?? "—"}`,
    },
    { titulo: "Situação", render: (t) => <BadgeEtapaTransferencia etapa={t.etapa} /> },
    {
      titulo: "Datas",
      render: (t) => (
        <span className="text-[12px] text-[#66707d]">
          Pedido em {formatarData(t.dataSolicitacao)}
          {t.dataConclusao ? ` · encerrada em ${formatarData(t.dataConclusao)}` : ""}
        </span>
      ),
    },
  ];

  if (pendentes === null && !erro) {
    return <Carregando texto="Carregando transferências..." />;
  }

  return (
    <>
      <Trilha itens={[{ rotulo: "Transferências" }]} />
      <TituloPagina
        titulo="Transferências"
        subtitulo="Administração da Rede · decidir pedidos, criar transferências avulsas e acompanhar o trânsito dos exemplares"
      />

      {erro && <Erro mensagem={erro} />}
      {sucesso && <Sucesso mensagem={sucesso} />}

      <DuasColunas
        esquerda={
          <>
            {/* ───────── 1. Pendentes ───────── */}
            <SectionCard titulo={`1. Pedidos aguardando decisão (${pendentes?.length ?? 0})`}>
              {pendentes?.length === 0 && (
                <Vazio texto="Nenhum pedido aguardando decisão. Eles aparecem aqui quando um usuário entra na fila escolhendo retirar em outra biblioteca." />
              )}

              <div className="flex flex-col gap-3">
                {(pendentes ?? []).map((p) => {
                  const impedimento = p.rn15.permitido ? p.bloqueioDestino : p.rn15.motivo;
                  return (
                    <div
                      key={p.id}
                      data-testid="pedido"
                      className="flex flex-wrap items-start gap-4 rounded-[10px] bg-[#f5f7fa] p-4"
                    >
                      <CapaLivro tamanho="sm" />

                      <div className="flex-1 min-w-[240px] flex flex-col gap-1">
                        <p className="text-[15px] font-semibold text-[#2c3e50]">
                          {p.titulo} — {p.autor}
                        </p>
                        <p className="text-[13px] text-[#66707d]">
                          Pedido de {p.solicitante.nome} em {formatarData(p.dataSolicitacao)}
                        </p>
                        <p className="text-[13px] text-[#125ca8]">
                          🔁 {p.origem.nome} → {p.destino.nome}
                        </p>
                        <p className="text-[13px] text-[#2c3e50]">
                          📦{" "}
                          {p.exemplar === "RETIDO" ? (
                            <strong>Exemplar já separado ({nomeExemplar(p.exemplarId!)})</strong>
                          ) : (
                            "Será vinculado na devolução"
                          )}
                        </p>
                        <p className="text-[12px] text-[#66707d]">{p.descricaoExemplar}</p>
                        {impedimento ? (
                          <p className="mt-1 rounded-[8px] bg-[#fce5e5] px-3 py-2 text-[13px] text-[#d32f2f]">
                            ⛔ Não pode ser aprovado agora: {impedimento}
                          </p>
                        ) : (
                          <p className="mt-1 text-[12px] text-[#125ca8]">✔ {capacidade(p)}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 w-[150px]">
                        <Botao
                          variante="verde"
                          disabled={!!impedimento}
                          onClick={() => setDecisao({ p, acao: "aprovar" })}
                        >
                          ✅ Aprovar
                        </Botao>
                        <Botao
                          variante="perigo"
                          onClick={() => {
                            setMotivo("");
                            setDecisao({ p, acao: "rejeitar" });
                          }}
                        >
                          ❌ Rejeitar
                        </Botao>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* ───────── 2. Avulsa em lote ───────── */}
            <SectionCard
              titulo="2. Transferência avulsa"
              acao={
                avulsaAberta ? (
                  <Botao variante="secundario" className="!px-3 !py-[6px] !text-[13px]" onClick={fecharAvulsa}>
                    Fechar
                  </Botao>
                ) : (
                  <Botao variante="primario" className="!px-3 !py-[6px] !text-[13px]" onClick={abrirAvulsa}>
                    ➕ Nova transferência avulsa
                  </Botao>
                )
              }
            >
              {!avulsaAberta && (
                <p className="text-[14px] text-[#66707d]">
                  Mova um ou mais exemplares disponíveis para qualquer biblioteca da
                  rede, sem depender de reserva. A transferência já nasce aprovada e
                  os exemplares saem em trânsito na hora.
                </p>
              )}

              {avulsaAberta && (
                <div className="flex flex-col gap-5">
                  {erroAvulsa && (
                    <div className="whitespace-pre-line" data-testid="erro-avulsa">
                      <Erro mensagem={erroAvulsa} />
                    </div>
                  )}

                  <Campo label="Passo 1 · Escolha os exemplares (somente disponíveis)">
                    <Entrada
                      aria-label="Buscar exemplar"
                      placeholder="Buscar por título, autor, biblioteca ou nº do exemplar..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                  </Campo>

                  {exemplares === null ? (
                    <Carregando texto="Carregando exemplares..." />
                  ) : (
                    <div className="rounded-[10px] border border-[#e0e0e0] overflow-hidden">
                      <TabelaPaginada
                        key={busca}
                        dados={exemplaresFiltrados}
                        colunas={colunasExemplar}
                        chave={(e) => e.id}
                        porPagina={8}
                        textoVazio="Nenhum exemplar disponível encontrado."
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-4 rounded-[10px] bg-[#f5f7fa] p-4">
                    <p className="text-[13px] text-[#2c3e50]" data-testid="selecionados">
                      {escolhidos.length === 0
                        ? "Nenhum exemplar selecionado."
                        : `${escolhidos.length} selecionado(s): ` +
                          escolhidos
                            .map((e) => `${e.livro.titulo} (${nomeExemplar(e.id)}, ${e.biblioteca.nome})`)
                            .join("; ")}
                    </p>

                    <Campo label="Passo 2 · Biblioteca de destino">
                      <Selecao
                        aria-label="Biblioteca de destino"
                        value={destinoId}
                        onChange={(e) => setDestinoId(e.target.value)}
                      >
                        <option value="">Selecione a biblioteca...</option>
                        {destinos.map((d) => (
                          <option key={d.bibliotecaId} value={d.bibliotecaId} disabled={!d.permitido}>
                            {d.nome}
                            {d.permitido ? "" : " (não pode receber)"}
                          </option>
                        ))}
                      </Selecao>
                    </Campo>
                    {bloqueados.length > 0 && (
                      <ul className="list-disc pl-5 text-[12px] text-[#66707d]">
                        {bloqueados.map((d) => (
                          <li key={d.bibliotecaId}>{d.motivo}</li>
                        ))}
                      </ul>
                    )}

                    <Campo label="Observações (opcional)">
                      <AreaTexto
                        aria-label="Observações"
                        placeholder="Ex.: reforço do acervo para o clube de leitura."
                        value={obs}
                        onChange={(e) => setObs(e.target.value)}
                      />
                    </Campo>

                    <div className="flex justify-end">
                      <Botao
                        variante="primario"
                        disabled={escolhidos.length === 0 || !destinoId}
                        onClick={() => setConfirmandoAvulsa(true)}
                      >
                        🚚 Transferir selecionados ({escolhidos.length})
                      </Botao>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ───────── 3. Acompanhamento ───────── */}
            <SectionCard
              titulo="3. Acompanhamento"
              acao={
                <Selecao
                  aria-label="Filtrar por situação"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="!w-[260px]"
                >
                  {FILTROS.map((f) => (
                    <option key={f.valor} value={f.valor}>
                      {f.rotulo}
                    </option>
                  ))}
                </Selecao>
              }
            >
              {acompanhamento === null ? (
                <Carregando texto="Carregando acompanhamento..." />
              ) : (
                <div className="rounded-[10px] border border-[#e0e0e0] overflow-hidden">
                  <TabelaPaginada
                    key={filtro}
                    dados={acompanhamento}
                    colunas={colunasAcompanhamento}
                    chave={(t) => t.id}
                    porPagina={8}
                    textoVazio="Nenhuma transferência nesta situação."
                  />
                </div>
              )}
            </SectionCard>
          </>
        }
        direita={
          <>
            <Callout tipo="info" titulo="Como nasce uma transferência">
              Pela reserva: um usuário entra na fila de uma biblioteca e escolhe
              retirar em outra. Ou avulsa: você move exemplares disponíveis.
            </Callout>
            <Callout tipo="info" titulo="Nenhuma biblioteca fica sem o livro">
              Um pedido só pode ser aprovado se a biblioteca de origem continuar
              com ao menos um exemplar do título depois de todas as transferências
              em andamento.
            </Callout>
            <Callout tipo="info" titulo="Chegada">
              Quem confirma a chegada é o bibliotecário da biblioteca de destino.
            </Callout>
            <CardResumo titulo="Resumo">
              <LinhaResumo rotulo="Aguardando decisão" valor={resumo?.pendentes ?? 0} destaque="laranja" />
              <LinhaResumo rotulo="Aprovadas, aguardando exemplar" valor={resumo?.aguardandoExemplar ?? 0} destaque="azul" />
              <LinhaResumo rotulo="Em trânsito" valor={resumo?.emTransito ?? 0} destaque="azul" />
              <LinhaResumo rotulo="Concluídas" valor={resumo?.concluidas ?? 0} destaque="verde" />
              <LinhaResumo rotulo="Rejeitadas" valor={resumo?.rejeitadas ?? 0} destaque="vermelho" />
            </CardResumo>
          </>
        }
      />

      <ModalConfirmacao
        aberto={!!decisao}
        titulo={decisao?.acao === "aprovar" ? "Aprovar este pedido?" : "Rejeitar este pedido?"}
        confirmarRotulo={decisao?.acao === "aprovar" ? "Aprovar" : "Rejeitar"}
        tom={decisao?.acao === "aprovar" ? "verde" : "perigo"}
        carregando={processando}
        onConfirmar={decidir}
        onCancelar={() => setDecisao(null)}
      >
        {decisao && (
          <>
            <ResumoModal
              linhas={[
                ["Livro", decisao.p.titulo],
                ["Solicitante", decisao.p.solicitante.nome],
                ["Trajeto", `${decisao.p.origem.nome} → ${decisao.p.destino.nome}`],
              ]}
            />
            {decisao.acao === "aprovar" ? (
              <p>
                {decisao.p.exemplar === "RETIDO"
                  ? `O ${nomeExemplar(decisao.p.exemplarId!)} já está separado e sai agora em trânsito para a ${decisao.p.destino.nome}.`
                  : `O pedido fica aprovado, aguardando exemplar: quando um exemplar for devolvido na ${decisao.p.origem.nome} e for a vez de ${decisao.p.solicitante.nome}, ele segue para a ${decisao.p.destino.nome}.`}
              </p>
            ) : (
              <>
                <p>
                  A reserva continua na fila e a retirada volta para a{" "}
                  {decisao.p.origem.nome}.
                  {decisao.p.exemplar === "RETIDO" &&
                    ` O ${nomeExemplar(decisao.p.exemplarId!)} fica pronto para ${decisao.p.solicitante.nome} retirar lá por 3 dias.`}
                </p>
                <Campo label="Motivo (opcional)">
                  <AreaTexto
                    aria-label="Motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </Campo>
              </>
            )}
          </>
        )}
      </ModalConfirmacao>

      <ModalConfirmacao
        aberto={confirmandoAvulsa}
        titulo="Criar transferências avulsas?"
        confirmarRotulo="Transferir"
        carregando={processando}
        onConfirmar={criarAvulsa}
        onCancelar={() => setConfirmandoAvulsa(false)}
      >
        <ResumoModal
          linhas={[
            ["Exemplares", String(escolhidos.length)],
            ["Destino", destinoSel?.nome ?? "—"],
            ...(obs.trim() ? ([["Observação", obs.trim()]] as [string, string][]) : []),
          ]}
        />
        <ul className="list-disc pl-5 text-[13px]">
          {escolhidos.map((e) => (
            <li key={e.id}>
              {e.livro.titulo} — {nomeExemplar(e.id)} ({e.biblioteca.nome})
            </li>
          ))}
        </ul>
        <p>
          Os exemplares saem em trânsito na hora. Se algum não puder sair, nada
          é criado e você verá o motivo.
        </p>
      </ModalConfirmacao>
    </>
  );
}
