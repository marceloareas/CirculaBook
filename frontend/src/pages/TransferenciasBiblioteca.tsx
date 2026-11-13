/**
 * Transferências da biblioteca — só a biblioteca do bibliotecário logado.
 *  - A receber: em trânsito para cá; "Confirmar chegada". Só o bibliotecário do destino confirma.
 *  - Saindo: pedidos abertos com origem aqui (somente leitura).
 */
import { useEffect, useState } from "react";
import { api, formatarData, nomeExemplar } from "../api/client";
import type { TransferenciaResumo } from "../types";
import { useUsuarioLogado } from "../auth/contexto";
import {
  BadgeEtapaTransferencia,
  Botao,
  Callout,
  Carregando,
  DuasColunas,
  Erro,
  SectionCard,
  Sucesso,
  TituloPagina,
  Trilha,
} from "../components/ui";
import ModalConfirmacao, { ResumoModal } from "../components/ModalConfirmacao";
import TabelaPaginada, { type Coluna } from "../components/TabelaPaginada";

type Aba = "receber" | "saindo";

export default function TransferenciasBiblioteca() {
  const { bibliotecaNome } = useUsuarioLogado();
  const [aba, setAba] = useState<Aba>("receber");
  const [aReceber, setAReceber] = useState<TransferenciaResumo[] | null>(null);
  const [saindo, setSaindo] = useState<TransferenciaResumo[] | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [alvo, setAlvo] = useState<TransferenciaResumo | null>(null);
  const [enviando, setEnviando] = useState(false);

  function carregar() {
    Promise.all([
      api.get<TransferenciaResumo[]>("/transferencias/biblioteca/a-receber"),
      api.get<TransferenciaResumo[]>("/transferencias/biblioteca/saindo"),
    ])
      .then(([r, s]) => {
        setAReceber(r);
        setSaindo([...s].sort((a, b) => b.id - a.id)); // mais recentes primeiro
      })
      .catch((e) => setErro(e.message));
  }
  useEffect(carregar, []);

  async function confirmar() {
    if (!alvo) return;
    setEnviando(true);
    setErro("");
    setSucesso("");
    try {
      await api.patch(`/transferencias/${alvo.id}/confirmar-chegada`);
      const ex = nomeExemplar(alvo.exemplarId!);
      setSucesso(
        alvo.reservadoPara
          ? `Chegada do ${ex} confirmada. Ele está separado para ${alvo.reservadoPara}, que tem 3 dias para retirar.`
          : `Chegada do ${ex} confirmada. Ele entrou no acervo da ${bibliotecaNome}.`,
      );
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setAlvo(null);
      setEnviando(false);
    }
  }

  const colunasBase: Coluna<TransferenciaResumo>[] = [
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
  ];

  const colunasReceber: Coluna<TransferenciaResumo>[] = [
    ...colunasBase,
    { titulo: "Vem da", render: (t) => t.origem.nome },
    {
      titulo: "Para quem",
      render: (t) =>
        t.reservadoPara ? `Reservado para ${t.reservadoPara}` : "Acervo (sem reserva)",
    },
    { titulo: "Enviado em", render: (t) => formatarData(t.dataSolicitacao) },
    {
      titulo: "Ação",
      className: "text-right",
      render: (t) => <Botao onClick={() => setAlvo(t)}>Confirmar chegada</Botao>,
    },
  ];

  const colunasSaindo: Coluna<TransferenciaResumo>[] = [
    ...colunasBase,
    { titulo: "Vai para", render: (t) => t.destino.nome },
    {
      titulo: "Para quem",
      render: (t) =>
        t.tipo === "AVULSA" ? "Avulsa (administrador)" : t.reservadoPara ?? "—",
    },
    { titulo: "Situação", render: (t) => <BadgeEtapaTransferencia etapa={t.etapa} /> },
  ];

  if (aReceber === null && !erro) {
    return <Carregando texto="Carregando transferências..." />;
  }

  const abaBtn = (valor: Aba, rotulo: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={aba === valor}
      onClick={() => setAba(valor)}
      className={`px-4 py-2 text-[14px] border-b-2 ${
        aba === valor
          ? "border-[#1976d2] font-semibold text-[#125ca8]"
          : "border-transparent text-[#66707d] hover:text-[#2c3e50]"
      }`}
    >
      {rotulo}
    </button>
  );

  return (
    <>
      <Trilha
        voltarPara="/biblioteca/emprestimo"
        itens={[{ rotulo: "Empréstimo", to: "/biblioteca/emprestimo" }, { rotulo: "Transferências" }]}
      />
      <TituloPagina
        titulo="Transferências"
        subtitulo={`${bibliotecaNome ?? ""} · exemplares chegando e saindo da biblioteca`}
      />

      {erro && <Erro mensagem={erro} />}
      {sucesso && <Sucesso mensagem={sucesso} />}

      <DuasColunas
        esquerda={
          <SectionCard titulo="Transferências da biblioteca">
            <div role="tablist" className="flex gap-2 border-b border-[#e0e0e0] mb-4">
              {abaBtn("receber", `A receber (${aReceber?.length ?? 0})`)}
              {abaBtn("saindo", `Saindo (${saindo?.length ?? 0})`)}
            </div>
            <div className="rounded-[10px] border border-[#e0e0e0] overflow-hidden" role="tabpanel">
              {aba === "receber" ? (
                <TabelaPaginada
                  key="receber"
                  dados={aReceber ?? []}
                  colunas={colunasReceber}
                  chave={(t) => t.id}
                  porPagina={8}
                  textoVazio="Nenhum exemplar a caminho desta biblioteca."
                />
              ) : (
                <TabelaPaginada
                  key="saindo"
                  dados={saindo ?? []}
                  colunas={colunasSaindo}
                  chave={(t) => t.id}
                  porPagina={8}
                  textoVazio="Nenhuma transferência saindo desta biblioteca."
                />
              )}
            </div>
          </SectionCard>
        }
        direita={
          <>
            <Callout tipo="info" titulo="Ao receber o exemplar">
              Confira o exemplar e confirme a chegada. Se ele foi reservado, fica
              separado para o leitor, que tem 3 dias para retirar.
            </Callout>
            <Callout tipo="info" titulo="Saindo daqui">
              Os exemplares que saem desta biblioteca seguem automaticamente na
              devolução, quando o pedido já está aprovado pelo administrador.
            </Callout>
          </>
        }
      />

      <ModalConfirmacao
        aberto={!!alvo}
        titulo="Confirmar chegada?"
        confirmarRotulo="Confirmar chegada"
        tom="verde"
        carregando={enviando}
        onConfirmar={confirmar}
        onCancelar={() => setAlvo(null)}
      >
        {alvo && (
          <ResumoModal
            linhas={[
              ["Livro", alvo.titulo],
              ["Exemplar", alvo.exemplarId ? nomeExemplar(alvo.exemplarId) : "—"],
              ["Vem da", alvo.origem.nome],
              ["Para quem", alvo.reservadoPara ?? "Acervo (sem reserva)"],
            ]}
          />
        )}
      </ModalConfirmacao>
    </>
  );
}
