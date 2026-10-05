/**
 * Minhas Reservas — acompanhamento da fila de espera do usuário (UC05 / UC07).
 *
 * Mostra, para cada reserva ativa (GET /api/reservas/minhas, sempre do usuário logado),
 * a biblioteca (fila e retirada), a posição na fila ou a data limite de retirada,
 * e permite cancelar a reserva.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatarData } from "../api/client";
import type { MinhaReserva } from "../types";
import {
  Badge,
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
  Vazio,
} from "../components/ui";
import ModalConfirmacao, { ResumoModal } from "../components/ModalConfirmacao";

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

  return (
    <>
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
                const pronta = r.status === "DISPONIVEL";
                return (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-start gap-4 rounded-[10px] bg-[#f5f7fa] p-4"
                  >
                    <CapaLivro tamanho="sm" />

                    <div className="flex-1 min-w-[240px] flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          to={`/livro/${r.livroId}`}
                          className="text-[15px] font-semibold text-[#2c3e50] hover:text-[#1976d2]"
                        >
                          {r.titulo}
                        </Link>
                        {pronta ? (
                          <Badge tom="verde">PRONTA PARA RETIRADA</Badge>
                        ) : (
                          <Badge tom="amarelo">NA FILA</Badge>
                        )}
                        {r.posicao && <Badge tom="cinza">{r.posicao}º na fila</Badge>}
                      </div>
                      <p className="text-[13px] text-[#66707d]">{r.autor}</p>
                      <p className="text-[13px] text-[#125ca8]">📍 {r.biblioteca}</p>
                      <p
                        className={`rounded-[8px] border px-3 py-2 text-[13px] leading-[1.45] ${
                          pronta
                            ? "bg-[#dbf0db] border-[#388e3c] text-[#2b6e2e]"
                            : "bg-white border-[#e0e0e0] text-[#2c3e50]"
                        }`}
                      >
                        {pronta
                          ? `Seu exemplar está pronto! Retire na ${r.biblioteca} até ${formatarData(r.retireAte)}.`
                          : `Você é o ${r.posicao ?? 1}º da fila na ${r.biblioteca}. O exemplar fica separado para você quando for a sua vez.`}
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
              ele fica separado para o 1º da fila, que tem 3 dias para retirá-lo
              na mesma biblioteca. Passado o prazo, a reserva expira e o próximo
              é atendido.
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
                ["Biblioteca", alvo.biblioteca],
              ]}
            />
            <p>
              Você perderá seu lugar na fila.
              {alvo.status === "DISPONIVEL" &&
                " O exemplar separado será liberado para o próximo da fila."}
            </p>
          </>
        )}
      </ModalConfirmacao>
    </>
  );
}
