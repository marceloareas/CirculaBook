/**
 * Minhas Reservas — acompanhamento da fila de espera do usuário (UC05 / UC07).
 *
 * Mostra, para cada reserva ativa (GET /api/reservas/minhas, sempre do usuário logado):
 *  - a posição na fila DA biblioteca (reserva é por biblioteca);
 *  - onde o usuário entrou na fila e onde vai retirar;
 *  - a etapa do pedido de transferência, quando a retirada é em outra biblioteca;
 *  - a data limite de retirada, quando o exemplar já está liberado.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatarData } from "../api/client";
import type { MinhaReserva, TransferenciaDaReserva } from "../types";
import {
  Badge,
  BadgeReserva,
  Botao,
  CapaLivro,
  Callout,
  CardResumo,
  Carregando,
  DuasColunas,
  Erro,
  LinhaResumo,
  SectionCard,
  Sucesso,
  TituloPagina,
  Trilha,
  Vazio,
} from "../components/ui";
import ModalConfirmacao, { ResumoModal } from "../components/ModalConfirmacao";

/** Rótulo curto da etapa da transferência. */
const ETAPA: Record<
  TransferenciaDaReserva["etapa"],
  { texto: string; tom: "amarelo" | "azul" | "verde" | "vermelho" | "cinza" }
> = {
  PENDENTE: { texto: "Transferência pendente", tom: "amarelo" },
  PENDENTE_COM_EXEMPLAR: { texto: "Exemplar separado, aguardando aprovação", tom: "amarelo" },
  APROVADA_AGUARDANDO_EXEMPLAR: { texto: "Aprovada, aguardando exemplar", tom: "azul" },
  EM_TRANSITO: { texto: "Em trânsito", tom: "azul" },
  CONCLUIDA: { texto: "Transferência concluída", tom: "verde" },
  REJEITADA: { texto: "Transferência rejeitada", tom: "vermelho" },
  CANCELADA: { texto: "Transferência cancelada", tom: "cinza" },
};

/** Mensagem principal do card, conforme o momento da reserva. */
function mensagemDe(r: MinhaReserva): { texto: string; tom: "neutro" | "azul" } {
  if (r.status === "DISPONIVEL") {
    return {
      tom: "azul",
      texto: `Seu exemplar está pronto! Retire na ${r.bibliotecaRetirada} até ${formatarData(r.retireAte)}.`,
    };
  }
  if (r.status === "AGUARDANDO_TRANSFERENCIA") {
    return {
      tom: "azul",
      texto:
        r.transferencia?.descricao ??
        `Um exemplar foi separado para você na ${r.bibliotecaFila}.`,
    };
  }
  const fila = `Você é o ${r.posicao ?? 1}º da fila na ${r.bibliotecaFila}.`;
  if (!r.transferencia) {
    return { tom: "neutro", texto: `${fila} O exemplar fica separado para você quando for a sua vez.` };
  }
  return { tom: "neutro", texto: `${fila} ${r.transferencia.descricao}` };
}

export default function MinhasReservas() {
  const [reservas, setReservas] = useState<MinhaReserva[] | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [alvo, setAlvo] = useState<MinhaReserva | null>(null);
  const [cancelando, setCancelando] = useState(false);

  function carregar() {
    api
      .get<MinhaReserva[]>("/reservas/minhas")
      .then(setReservas)
      .catch((e) => setErro(e.message));
  }
  useEffect(carregar, []);

  async function cancelar() {
    if (!alvo) return;
    setCancelando(true);
    setErro("");
    setSucesso("");
    try {
      await api.patch(`/reservas/${alvo.id}/cancelar`);
      setSucesso(`Reserva de "${alvo.titulo}" cancelada.`);
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setAlvo(null);
      setCancelando(false);
    }
  }

  if (reservas === null && !erro) {
    return <Carregando texto="Carregando suas reservas..." />;
  }
  const ativas = reservas ?? [];
  const emTransito = alvo?.transferencia?.etapa === "EM_TRANSITO";

  return (
    <>
      <Trilha itens={[{ rotulo: "Minhas Reservas" }]} />
      <TituloPagina
        titulo="Minhas Reservas"
        subtitulo="Acompanhe sua posição nas filas de espera e a retirada dos livros reservados"
      />

      {erro && <Erro mensagem={erro} />}
      {sucesso && <Sucesso mensagem={sucesso} />}

      <DuasColunas
        esquerda={
          <SectionCard titulo={`Reservas em andamento (${ativas.length})`}>
            {ativas.length === 0 && (
              <Vazio texto="Você não tem reservas em andamento. Quando todos os exemplares de um livro estiverem emprestados numa biblioteca, você pode entrar na fila dela." />
            )}

            <div className="flex flex-col gap-3">
              {ativas.map((r) => {
                const msg = mensagemDe(r);
                const caixa = {
                  neutro: "bg-white border-[#e0e0e0] text-[#2c3e50]",
                  azul: "bg-[#deedfc] border-[#1976d2] text-[#125ca8]",
                }[msg.tom];
                const etapa = r.transferencia ? ETAPA[r.transferencia.etapa] : null;

                return (
                  <div
                    key={r.id}
                    data-testid="reserva"
                    className="flex flex-wrap items-start gap-4 rounded-[10px] bg-[#f5f7fa] p-4"
                  >
                    <CapaLivro tamanho="sm" />

                    <div className="flex-1 min-w-[260px] flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          to={`/livro/${r.livroId}`}
                          className="text-[15px] font-semibold text-[#2c3e50] hover:text-[#1976d2]"
                        >
                          {r.titulo}
                        </Link>
                        <BadgeReserva status={r.status} />
                        {r.posicao && <Badge tom="cinza">{r.posicao}º na fila</Badge>}
                      </div>
                      <p className="text-[13px] text-[#66707d]">{r.autor}</p>
                      <p className="text-[13px] text-[#125ca8]">
                        📍 Fila na {r.bibliotecaFila} → retirada na {r.bibliotecaRetirada}
                      </p>
                      {etapa && (
                        <div>
                          <Badge tom={etapa.tom}>🚚 {etapa.texto}</Badge>
                        </div>
                      )}
                      {r.retireAte && (
                        <p className="text-[13px] font-semibold text-[#125ca8]">
                          Retire até {formatarData(r.retireAte)}
                        </p>
                      )}
                      <p
                        className={`rounded-[8px] border px-3 py-2 text-[13px] leading-[1.45] ${caixa}`}
                      >
                        {msg.texto}
                      </p>
                      <p className="text-[12px] text-[#9aa3ad]">
                        Reservado em {formatarData(r.dataReserva)}
                      </p>
                    </div>

                    <div className="w-[150px]">
                      <Botao variante="perigo" className="w-full" onClick={() => setAlvo(r)}>
                        Cancelar reserva
                      </Botao>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        }
        direita={
          <>
            <Callout tipo="info" titulo="Como funciona a fila">
              A fila é de cada biblioteca. Quando um exemplar é devolvido nela,
              ele fica separado para o 1º da fila, que tem 3 dias para retirar.
              Passado o prazo, a reserva expira e o próximo é atendido.
            </Callout>

            <Callout tipo="info" titulo="Retirada em outra biblioteca">
              Se você escolheu retirar em outra unidade, o administrador precisa
              aprovar o pedido. Se ele recusar, sua reserva continua na fila e a
              retirada passa a ser na biblioteca onde você a fez.
            </Callout>

            <CardResumo
              titulo="Resumo"
              rodape={
                <Botao variante="secundario" className="w-full" onClick={carregar}>
                  🔄 Atualizar
                </Botao>
              }
            >
              <LinhaResumo
                rotulo="Na fila"
                valor={ativas.filter((r) => r.status === "PENDENTE").length}
                destaque="laranja"
              />
              <LinhaResumo
                rotulo="Aguardando transferência"
                valor={ativas.filter((r) => r.status === "AGUARDANDO_TRANSFERENCIA").length}
                destaque="azul"
              />
              <LinhaResumo
                rotulo="Prontas para retirada"
                valor={ativas.filter((r) => r.status === "DISPONIVEL").length}
                destaque="verde"
              />
            </CardResumo>
          </>
        }
      />

      <ModalConfirmacao
        aberto={!!alvo}
        titulo="Cancelar esta reserva?"
        confirmarRotulo="Cancelar reserva"
        cancelarRotulo="Manter reserva"
        tom="perigo"
        carregando={cancelando}
        onConfirmar={cancelar}
        onCancelar={() => setAlvo(null)}
      >
        {alvo && (
          <>
            <ResumoModal
              linhas={[
                ["Livro", alvo.titulo],
                ["Fila", alvo.bibliotecaFila],
                ["Retirada", alvo.bibliotecaRetirada],
              ]}
            />
            <p>
              Você perderá seu lugar na fila.
              {alvo.status === "DISPONIVEL" &&
                " O exemplar separado será liberado para o próximo da fila."}
            </p>
            {emTransito && (
              <p className="rounded-[8px] bg-[#deedfc] text-[#125ca8] px-3 py-2 text-[13px]">
                ℹ️ O exemplar já está a caminho da {alvo.bibliotecaRetirada}. A
                viagem continua mesmo com o cancelamento: ele chegará ao destino
                e ficará disponível lá para qualquer leitor.
              </p>
            )}
          </>
        )}
      </ModalConfirmacao>
    </>
  );
}
