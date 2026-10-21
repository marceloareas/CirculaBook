/**
 * Meus Empréstimos — o usuário acompanha o que está com ele, os prazos
 * e se está apto a pegar novos livros (UC05 / UC08). Somente leitura.
 * Dados de GET /api/conta/emprestimos (sempre do usuário logado).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, nomeExemplar, formatarData } from "../api/client";
import type { MeuEmprestimo, MeusEmprestimos as Dados } from "../types";
import {
  Badge,
  Botao,
  Callout,
  CapaLivro,
  CardResumo,
  Carregando,
  DuasColunas,
  Erro,
  LinhaResumo,
  SectionCard,
  TituloPagina,
  Trilha,
  Vazio,
} from "../components/ui";

const DIAS_BLOQUEIO_POR_ATRASO = 2;

/** Dias que faltam até a devolução (arredondado para cima; 0 = vence hoje). */
function diasRestantes(prev: string): number {
  return Math.ceil((new Date(prev).getTime() - Date.now()) / 86_400_000);
}

function PrazoBadge({ e }: { e: MeuEmprestimo }) {
  if (e.atrasado) {
    const d = Math.max(1, e.diasAtraso);
    return <Badge tom="vermelho">Atrasado há {d} {d === 1 ? "dia" : "dias"}</Badge>;
  }
  const r = diasRestantes(e.dataPrevDevolucao);
  if (r <= 0) return <Badge tom="amarelo">Vence hoje</Badge>;
  if (r <= 3) return <Badge tom="amarelo">Faltam {r} {r === 1 ? "dia" : "dias"}</Badge>;
  return <Badge tom="verde">Faltam {r} dias</Badge>;
}

export default function MeusEmprestimos() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api
      .get<Dados>("/conta/emprestimos")
      .then(setDados)
      .catch((e) => setErro(e.message));
  }, []);

  if (dados === null && !erro) {
    return <Carregando texto="Carregando seus empréstimos..." />;
  }

  const abertos = dados?.emprestimos ?? [];
  const atrasados = abertos.filter((e) => e.atrasado).length;
  const limite = dados?.limite ?? 3;
  const total = dados?.total ?? abertos.length;
  const bloqueado = !!dados?.bloqueado;
  const apto = !bloqueado && total < limite;

  return (
    <>
      <Trilha itens={[{ rotulo: "Meus Empréstimos" }]} />
      <TituloPagina
        titulo="Meus Empréstimos"
        subtitulo="Livros que estão com você, prazos de devolução e sua situação na rede"
      />

      {erro && <Erro mensagem={erro} />}

      {bloqueado && (
        <Callout tipo="aviso" titulo="Empréstimos bloqueados">
          Por causa de devolução em atraso, você não pode fazer novos
          empréstimos até <strong>{formatarData(dados?.bloqueadoAte)}</strong>.
        </Callout>
      )}
      {!bloqueado && atrasados > 0 && (
        <Callout tipo="aviso" titulo="Você tem livros atrasados">
          Devolva o quanto antes na biblioteca onde retirou. Cada dia de atraso
          gera {DIAS_BLOQUEIO_POR_ATRASO} dias de bloqueio para novos
          empréstimos.
        </Callout>
      )}

      <DuasColunas
        esquerda={
          <SectionCard titulo={`Em andamento (${abertos.length})`}>
            {abertos.length === 0 && (
              <Vazio texto="Você não tem livros emprestados no momento." />
            )}

            <div className="flex flex-col gap-3">
              {abertos.map((e) => (
                <div
                  key={e.id}
                  data-testid="emprestimo"
                  className={`flex flex-wrap items-center gap-4 rounded-[10px] p-4 ${
                    e.atrasado ? "bg-[#fce5e5]" : "bg-[#f5f7fa]"
                  }`}
                >
                  <CapaLivro tamanho="sm" />
                  <div className="flex-1 min-w-[240px] flex flex-col gap-1">
                    <Link
                      to={`/livro/${e.livroId}`}
                      className="text-[15px] font-semibold text-[#2c3e50] hover:text-[#1976d2]"
                    >
                      {e.titulo}
                    </Link>
                    <p className="text-[13px] text-[#66707d]">{e.autor}</p>
                    <p className="text-[13px] text-[#125ca8]">
                      📍 {e.biblioteca} · {nomeExemplar(e.exemplarId)}
                    </p>
                    <p className="text-[12px] text-[#66707d]">
                      Retirado em {formatarData(e.dataEmprestimo)} · devolver até{" "}
                      <strong>{formatarData(e.dataPrevDevolucao)}</strong>
                    </p>
                  </div>
                  <PrazoBadge e={e} />
                </div>
              ))}
            </div>
          </SectionCard>
        }
        direita={
          <>
            <Callout tipo="info" titulo="Como devolver">
              A devolução é feita presencialmente: leve o livro à biblioteca onde
              retirou e o bibliotecário registra no sistema. O prazo é de 14
              dias corridos.
            </Callout>

            <CardResumo
              titulo="Minha situação"
              rodape={
                <Link to="/">
                  <Botao variante="primario" className="w-full">
                    🔎 Buscar livros
                  </Botao>
                </Link>
              }
            >
              <LinhaResumo
                rotulo="Empréstimos em aberto"
                valor={`${total} de ${limite}`}
                destaque={total >= limite ? "vermelho" : "azul"}
              />
              <LinhaResumo
                rotulo="Atrasados"
                valor={atrasados}
                destaque={atrasados > 0 ? "vermelho" : "verde"}
              />
              <LinhaResumo
                rotulo="Apto a emprestar"
                valor={apto ? "Sim" : "Não"}
                destaque={apto ? "verde" : "vermelho"}
              />
              {bloqueado && (
                <LinhaResumo
                  rotulo="Bloqueado até"
                  valor={formatarData(dados?.bloqueadoAte)}
                  destaque="vermelho"
                />
              )}
            </CardResumo>
          </>
        }
      />
    </>
  );
}
