/**
 * Reservar Livro (UC03).
 * O usuário entra na fila de uma biblioteca que tem o título e onde todos os
 * exemplares estão emprestados. A retirada é sempre nessa mesma biblioteca.
 * Ao confirmar, a própria tela mostra o livro, a biblioteca e a posição na fila.
 */
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { LivroResumo, Reserva } from "../types";
import {
  BadgeSituacao,
  Botao,
  Campo,
  CapaLivro,
  Callout,
  CardResumo,
  Carregando,
  DuasColunas,
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

export default function ReservarLivro() {
  const { livroId: livroIdParam } = useParams();
  const livroId = Number(livroIdParam);
  const [searchParams] = useSearchParams();
  const bibliotecaParam = Number(searchParams.get("biblioteca")) || undefined;

  const [livro, setLivro] = useState<LivroResumo | null>(null);
  const [posicao, setPosicao] = useState<number | null>(null);
  const [bibliotecaId, setBibliotecaId] = useState<number | "">("");

  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmada, setConfirmada] = useState<Reserva | null>(null);

  useEffect(() => {
    api
      .get<LivroResumo>(`/livros/${livroId}`)
      .then((l) => {
        setLivro(l);
        const fila = (l.disponibilidade ?? []).filter(
          (x) => x.disponiveis === 0 && x.totalExemplares > 0,
        );
        setBibliotecaId(
          fila.find((x) => x.bibliotecaId === bibliotecaParam)?.bibliotecaId ??
            fila[0]?.bibliotecaId ??
            "",
        );
      })
      .catch((e) => setErro(e.message));
  }, [livroId, bibliotecaParam]);

  useEffect(() => {
    if (bibliotecaId === "") return;
    api
      .get<{ posicao: number }>(
        `/reservas/posicao/${livroId}?bibliotecaId=${bibliotecaId}`,
      )
      .then((p) => setPosicao(p.posicao))
      .catch(() => setPosicao(null));
  }, [livroId, bibliotecaId]);

  if (erro && !livro) return <Erro mensagem={erro} />;
  if (!livro) return <Carregando texto="Carregando título..." />;

  const disponibilidade = livro.disponibilidade ?? [];
  const paraFila = disponibilidade.filter(
    (d) => d.disponiveis === 0 && d.totalExemplares > 0,
  );
  const nomeBib = (id: number | "") =>
    disponibilidade.find((d) => d.bibliotecaId === id)?.bibliotecaNome ?? "—";

  async function executar() {
    setEnviando(true);
    setErro("");
    try {
      const r = await api.post<Reserva>("/reservas", { livroId, bibliotecaId });
      setConfirmada(r);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
      setModalAberto(false);
    }
  }

  const trilha = (
    <Trilha
      itens={[
        { rotulo: "Buscar Livros", to: "/" },
        { rotulo: livro.titulo, to: `/livro/${livroId}` },
        { rotulo: "Reservar" },
      ]}
    />
  );

  if (confirmada) {
    return (
      <>
        {trilha}
        <TituloPagina
          titulo="Reserva confirmada"
          subtitulo="Você será atendido por ordem de chegada na fila desta biblioteca"
        />
        <Sucesso
          mensagem={`Você entrou na fila de "${confirmada.livro.titulo}" na ${confirmada.bibliotecaFila.nome}.`}
        />
        <CardResumo titulo="Sua reserva">
          <LinhaResumo rotulo="Livro" valor={confirmada.livro.titulo} />
          <LinhaResumo rotulo="Biblioteca (fila e retirada)" valor={confirmada.bibliotecaFila.nome} />
          <LinhaResumo
            rotulo="Posição na fila"
            valor={confirmada.posicaoFila ? `${confirmada.posicaoFila}º lugar` : "—"}
          />
          <LinhaResumo rotulo="Prazo p/ retirada" valor="3 dias corridos após a devolução" />
        </CardResumo>
        <Link
          to="/minhas-reservas"
          className="mt-4 inline-block text-[14px] font-semibold text-[#1976d2] hover:underline"
        >
          Ver minhas reservas →
        </Link>
      </>
    );
  }

  return (
    <>
      {trilha}
      <TituloPagina
        titulo="Reservar Livro"
        subtitulo="Entre na fila de espera da biblioteca e retire o exemplar nela mesma"
      />

      {erro && <Erro mensagem={erro} />}

      <DuasColunas
        esquerda={
          <>
            <SectionCard titulo="Livro selecionado">
              <div className="flex items-center gap-5">
                <CapaLivro tamanho="md" />
                <div className="min-w-0">
                  <h3 className="text-[18px] font-semibold text-[#2c3e50]">
                    {livro.titulo}
                  </h3>
                  <p className="text-[14px] text-[#66707d] mt-1">
                    {livro.autor}
                  </p>
                  <p className="text-[13px] text-[#66707d]">
                    {[livro.categoria, livro.anoPublicacao]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <BadgeSituacao situacao={livro.situacao} />
                    <span className="text-[13px] text-[#66707d]">
                      {livro.disponiveis > 0
                        ? `${livro.disponiveis} exemplar(es) disponível(is) agora`
                        : `Todos emprestados · ${livro.naFilaDeEspera} ${livro.naFilaDeEspera === 1 ? "pessoa" : "pessoas"} na fila`}
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard titulo="Em qual biblioteca você quer entrar na fila?">
              {paraFila.length === 0 ? (
                <Vazio texto="Nenhuma biblioteca está com todos os exemplares emprestados. Como há exemplar livre, vá a uma unidade e faça o empréstimo presencialmente." />
              ) : (
                <Campo label="Bibliotecas com todos os exemplares emprestados">
                  <Selecao
                    value={bibliotecaId}
                    onChange={(e) => setBibliotecaId(Number(e.target.value))}
                  >
                    {paraFila.map((d) => (
                      <option key={d.bibliotecaId} value={d.bibliotecaId}>
                        {d.bibliotecaNome} — 0 de {d.totalExemplares}{" "}
                        disponíveis
                      </option>
                    ))}
                  </Selecao>
                </Campo>
              )}
            </SectionCard>
          </>
        }
        direita={
          <>
            <Callout tipo="info" titulo="Como funciona a fila de espera">
              Quando um exemplar for devolvido na sua vez, ele fica separado
              para você na mesma biblioteca e você tem 3 dias corridos para
              retirá-lo. Depois disso a reserva expira e passa para o próximo.
            </Callout>
            <Callout tipo="aviso" titulo="Quando posso reservar?">
              Só é possível reservar em bibliotecas onde todos os exemplares
              estão emprestados. Havendo exemplar livre, o empréstimo é
              presencial.
            </Callout>

            <CardResumo
              titulo="Resumo da reserva"
              rodape={
                <Botao
                  onClick={() => setModalAberto(true)}
                  disabled={bibliotecaId === "" || enviando}
                  className="w-full"
                >
                  📌 Entrar na fila
                </Botao>
              }
            >
              <LinhaResumo rotulo="Livro" valor={livro.titulo} />
              <LinhaResumo rotulo="Biblioteca" valor={nomeBib(bibliotecaId)} />
              <LinhaResumo
                rotulo="Posição na fila"
                valor={posicao ? `${posicao}º lugar` : "—"}
              />
              <LinhaResumo rotulo="Prazo p/ retirada" valor="3 dias corridos" />
            </CardResumo>
          </>
        }
      />

      <ModalConfirmacao
        aberto={modalAberto}
        titulo="Confirmar reserva?"
        confirmarRotulo="Entrar na fila"
        carregando={enviando}
        onConfirmar={executar}
        onCancelar={() => setModalAberto(false)}
      >
        <p>
          Você entrará na <strong>posição {posicao ?? "—"}</strong> da fila da{" "}
          <strong>{nomeBib(bibliotecaId)}</strong>.
        </p>
        <ResumoModal
          linhas={[
            ["Livro", livro.titulo],
            ["Fila e retirada em", nomeBib(bibliotecaId)],
          ]}
        />
      </ModalConfirmacao>
    </>
  );
}
