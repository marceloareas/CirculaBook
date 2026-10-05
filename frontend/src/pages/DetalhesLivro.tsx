/**
 * TELA 3 — Detalhes do Livro (UC02).
 * Mostra a ficha do título e a disponibilidade em cada biblioteca da rede.
 * Com exemplar livre, "Como retirar" explica o empréstimo presencial;
 * sem exemplar livre, "Entrar na fila" leva à reserva.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Disponibilidade, LivroResumo } from "../types";
import {
  Badge,
  BadgeSituacao,
  Botao,
  Card,
  Carregando,
  CapaLivro,
  Entrada,
  Erro,
  LinhaResumo,
  Trilha,
} from "../components/ui";
import TabelaPaginada, { type Coluna } from "../components/TabelaPaginada";
import ModalConfirmacao from "../components/ModalConfirmacao";

export default function DetalhesLivro() {
  const { livroId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const voltarPara = (location.state as { voltarPara?: string } | null)
    ?.voltarPara;

  const [livro, setLivro] = useState<LivroResumo | null>(null);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [soDisponiveis, setSoDisponiveis] = useState(false);
  const [retirada, setRetirada] = useState<Disponibilidade | null>(null);

  useEffect(() => {
    api
      .get<LivroResumo>(`/livros/${livroId}`)
      .then(setLivro)
      .catch((e) => setErro(e.message));
  }, [livroId]);

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (livro?.disponibilidade ?? [])
      .filter((d) => !soDisponiveis || d.disponiveis > 0)
      .filter(
        (d) =>
          !termo ||
          d.bibliotecaNome.toLowerCase().includes(termo) ||
          (d.endereco ?? "").toLowerCase().includes(termo),
      )
      .sort(
        (a, b) =>
          b.disponiveis - a.disponiveis ||
          a.bibliotecaNome.localeCompare(b.bibliotecaNome),
      );
  }, [livro, busca, soDisponiveis]);

  if (erro) return <Erro mensagem={erro} />;
  if (!livro) return <Carregando texto="Carregando detalhes do título..." />;

  const todas = livro.disponibilidade ?? [];
  const unidadesComLivre = todas.filter((d) => d.disponiveis > 0).length;

  const colunas: Coluna<Disponibilidade>[] = [
    {
      titulo: "Biblioteca",
      render: (d) => (
        <div>
          <p className="font-semibold text-[#2c3e50]">{d.bibliotecaNome}</p>
          <p className="text-[12px] text-[#66707d]">{d.endereco ?? "—"}</p>
        </div>
      ),
    },
    {
      titulo: "Disponíveis",
      render: (d) => (
        <div>
          <p className="text-[#2c3e50]">
            <strong className="text-[16px]">{d.disponiveis}</strong>
            <span className="text-[#66707d]"> / {d.totalExemplares}</span>
          </p>
          <div className="mt-1 h-[6px] w-[90px] overflow-hidden rounded-full bg-[#e0e0e0]">
            <div
              className={`h-full ${d.disponiveis > 0 ? "bg-[#388e3c]" : "bg-[#d32f2f]"}`}
              style={{
                width: `${d.totalExemplares ? (d.disponiveis / d.totalExemplares) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      titulo: "Situação",
      render: (d) =>
        d.disponiveis > 0 ? (
          <Badge tom="verde">🟢 Disponível</Badge>
        ) : (
          <Badge tom="vermelho">🔴 Indisponível</Badge>
        ),
    },
    {
      titulo: "Ação",
      className: "text-right",
      render: (d) =>
        d.disponiveis > 0 ? (
          <Botao variante="secundario" onClick={() => setRetirada(d)}>
            Como retirar
          </Botao>
        ) : (
          <Botao
            onClick={() =>
              navigate(
                `/livro/${livro.id}/reservar?biblioteca=${d.bibliotecaId}`,
              )
            }
          >
            Entrar na fila
          </Botao>
        ),
    },
  ];

  return (
    <>
      <Trilha
        itens={[
          { rotulo: "Buscar Livros", to: "/" },
          ...(voltarPara ? [{ rotulo: "Resultados", to: voltarPara }] : []),
          { rotulo: livro.titulo },
        ]}
      />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-5">
          <CapaLivro tamanho="lg" />
          <Card className="p-5 flex flex-col gap-3">
            <LinhaResumo rotulo="Editora" valor={livro.editora ?? "—"} />
            <LinhaResumo
              rotulo="Ano de publicação"
              valor={livro.anoPublicacao ?? "—"}
            />
            <LinhaResumo rotulo="ISBN" valor={livro.isbn ?? "—"} />
            <LinhaResumo rotulo="Categoria" valor={livro.categoria ?? "—"} />
          </Card>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div>
            <h1 className="text-[32px] font-bold text-[#2c3e50] leading-tight">
              {livro.titulo}
            </h1>
            <p className="text-[18px] text-[#66707d] mt-2">{livro.autor}</p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {livro.categoria && <Badge tom="cinza">{livro.categoria}</Badge>}
              <BadgeSituacao situacao={livro.situacao} />
            </div>
          </div>

          {livro.sinopse && (
            <div>
              <h2 className="text-[15px] font-semibold text-[#2c3e50] mb-2">
                Sinopse
              </h2>
              <p className="text-[14px] leading-relaxed text-[#66707d] max-w-[70ch]">
                {livro.sinopse}
              </p>
            </div>
          )}

          <Card className="overflow-hidden">
            <div className="p-6 pb-4 flex flex-col gap-4">
              <div>
                <h2 className="text-[17px] font-semibold text-[#2c3e50]">
                  Disponibilidade na rede
                </h2>
                <p className="text-[13px] text-[#66707d] mt-1">
                  {livro.disponiveis} de {livro.totalExemplares} exemplares
                  livres · {unidadesComLivre} de {todas.length}{" "}
                  {todas.length === 1 ? "biblioteca" : "bibliotecas"} com
                  exemplar disponível
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[220px]">
                  <Entrada
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="🔎 Buscar biblioteca ou endereço..."
                  />
                </div>
                <label className="flex items-center gap-2 text-[13px] text-[#2c3e50] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soDisponiveis}
                    onChange={(e) => setSoDisponiveis(e.target.checked)}
                  />
                  Só com exemplar disponível
                </label>
              </div>
            </div>

            <TabelaPaginada
              key={`${busca}|${soDisponiveis}`}
              dados={linhas}
              colunas={colunas}
              chave={(d) => d.bibliotecaId}
              porPagina={5}
              classeLinha={(d) => (d.disponiveis === 0 ? "bg-[#fdf3f3]" : "")}
              textoVazio={
                todas.length === 0
                  ? "Nenhum exemplar deste título está cadastrado na rede ainda."
                  : "Nenhuma biblioteca corresponde aos filtros."
              }
            />
          </Card>
        </div>
      </div>

      <ModalConfirmacao
        aberto={!!retirada}
        titulo={`Retirar na ${retirada?.bibliotecaNome ?? ""}`}
        confirmarRotulo="Entendi"
        cancelarRotulo={null}
        onConfirmar={() => setRetirada(null)}
        onCancelar={() => setRetirada(null)}
      >
        <p>
          Há <strong>{retirada?.disponiveis}</strong>{" "}
          {retirada?.disponiveis === 1
            ? "exemplar disponível"
            : "exemplares disponíveis"}{" "}
          de <strong>{livro.titulo}</strong> nesta unidade
          {retirada?.endereco ? ` (${retirada.endereco})` : ""}.
        </p>
        <p>
          O empréstimo é feito <strong>presencialmente</strong>, com o
          bibliotecário. Leve um documento de identificação. Como há exemplar
          livre, não é necessário reservar.
        </p>
      </ModalConfirmacao>
    </>
  );
}
