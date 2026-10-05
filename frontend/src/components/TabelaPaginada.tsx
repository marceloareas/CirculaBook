/** Tabela genérica com paginação no cliente. */
import { useState, type ReactNode } from "react";

export interface Coluna<T> {
  titulo: string;
  render: (item: T) => ReactNode;
  className?: string;
}

export default function TabelaPaginada<T>({
  dados,
  colunas,
  chave,
  porPagina = 10,
  classeLinha,
  textoVazio = "Nenhum registro encontrado.",
}: {
  dados: T[];
  colunas: Coluna<T>[];
  chave: (item: T) => string | number;
  porPagina?: number;
  /** Classes extras por linha (ex.: fundo vermelho para atrasados). */
  classeLinha?: (item: T) => string;
  textoVazio?: string;
}) {
  const [pagina, setPagina] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(dados.length / porPagina));
  const atual = Math.min(pagina, totalPaginas);
  const inicio = (atual - 1) * porPagina;
  const visiveis = dados.slice(inicio, inicio + porPagina);

  // Janela de até 5 números de página ao redor da atual
  const primeiro = Math.max(1, Math.min(atual - 2, totalPaginas - 4));
  const ultimo = Math.min(totalPaginas, primeiro + 4);
  const numeros: number[] = [];
  for (let n = primeiro; n <= ultimo; n++) numeros.push(n);

  const btn =
    "min-w-[34px] h-[34px] px-2 rounded-[8px] text-[13px] font-medium border";

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-[#e0e0e0] bg-[#f5f7fa]">
              {colunas.map((c) => (
                <th
                  key={c.titulo}
                  className={`px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#66707d] ${c.className ?? ""}`}
                >
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((item) => (
              <tr
                key={chave(item)}
                className={`border-b border-[#eceff3] last:border-b-0 ${classeLinha?.(item) ?? ""}`}
              >
                {colunas.map((c) => (
                  <td
                    key={c.titulo}
                    className={`px-4 py-3 align-middle ${c.className ?? ""}`}
                  >
                    {c.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dados.length === 0 && (
        <p className="py-10 text-center text-[14px] text-[#66707d]">
          {textoVazio}
        </p>
      )}

      {dados.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[#e0e0e0]">
          <span className="text-[13px] text-[#66707d]">
            Mostrando {inicio + 1}–{Math.min(inicio + porPagina, dados.length)}{" "}
            de {dados.length}
          </span>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={atual === 1}
                onClick={() => setPagina(atual - 1)}
                className={`${btn} border-[#e0e0e0] bg-white disabled:opacity-40`}
              >
                ‹
              </button>
              {numeros.map((n) => (
                <button
                  key={n}
                  onClick={() => setPagina(n)}
                  aria-current={n === atual ? "page" : undefined}
                  className={`${btn} ${
                    n === atual
                      ? "border-[#1976d2] bg-[#1976d2] text-white"
                      : "border-[#e0e0e0] bg-white text-[#2c3e50] hover:bg-[#eceff3]"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={atual === totalPaginas}
                onClick={() => setPagina(atual + 1)}
                className={`${btn} border-[#e0e0e0] bg-white disabled:opacity-40`}
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
