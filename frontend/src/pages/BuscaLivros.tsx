/**
 * TELA 1 — Busca de Livros na Rede (UC01 / RN09).
 * Coleta os filtros e navega para a tela de resultados.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, qs } from "../api/client";
import type { Categoria } from "../types";
import {
  Botao,
  Campo,
  Card,
  Chip,
  Entrada,
  Selecao,
  TituloPagina,
} from "../components/ui";

export interface Filtros {
  termo: string;
  autor: string;
  isbn: string;
  categoriaId: string;
  anoDe: string;
  anoAte: string;
}

const FILTROS_VAZIOS: Filtros = {
  termo: "",
  autor: "",
  isbn: "",
  categoriaId: "",
  anoDe: "",
  anoAte: "",
};

export default function BuscaLivros() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    api
      .get<Categoria[]>("/categorias")
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, []);

  function alterar(campo: keyof Filtros, valor: string) {
    setFiltros((f) => ({ ...f, [campo]: valor }));
  }

  function buscar() {
    navigate("/resultados" + qs({ ...filtros }));
  }

  function buscarPorCategoria(id: number) {
    navigate("/resultados" + qs({ categoriaId: id }));
  }

  return (
    <>
      <TituloPagina
        titulo="Buscar Livros na Rede"
        subtitulo="Encontre livros disponíveis em qualquer biblioteca da rede Circula Book"
      />

      <Card className="p-8 flex flex-col gap-6">
        {/* Busca principal */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={filtros.termo}
            onChange={(e) => alterar("termo", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            placeholder="🔎  Buscar por título, autor ou ISBN..."
            aria-label="Buscar por título, autor ou ISBN"
            className="flex-1 h-[52px] rounded-[8px] border border-[#e0e0e0] bg-[#f5f7fa]
                       px-4 text-[15px] text-[#2c3e50] placeholder:text-[#66707d]"
          />
          <Botao onClick={buscar} className="sm:w-[150px] h-[52px]">
            Buscar
          </Botao>
        </div>

        <h2 className="text-[15px] font-semibold text-[#2c3e50]">
          Filtros avançados
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
          <Campo label="Gênero / Categoria">
            <Selecao
              value={filtros.categoriaId}
              onChange={(e) => alterar("categoriaId", e.target.value)}
            >
              <option value="">Todos os gêneros</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Selecao>
          </Campo>

          <Campo label="Autor">
            <Entrada
              value={filtros.autor}
              onChange={(e) => alterar("autor", e.target.value)}
              placeholder="Ex: Machado de Assis"
            />
          </Campo>

          <Campo label="Ano de publicação (de)">
            <Entrada
              type="number"
              value={filtros.anoDe}
              onChange={(e) => alterar("anoDe", e.target.value)}
              placeholder="Ex: 1990"
            />
          </Campo>

          <Campo label="Ano de publicação (até)">
            <Entrada
              type="number"
              value={filtros.anoAte}
              onChange={(e) => alterar("anoAte", e.target.value)}
              placeholder="Ex: 2026"
            />
          </Campo>

          <Campo label="ISBN">
            <Entrada
              value={filtros.isbn}
              onChange={(e) => alterar("isbn", e.target.value)}
              placeholder="Ex: 978-85-..."
            />
          </Campo>
        </div>

        <div className="flex gap-3">
          <Botao
            variante="secundario"
            onClick={() => setFiltros(FILTROS_VAZIOS)}
          >
            Limpar filtros
          </Botao>
          <Botao onClick={buscar}>Aplicar filtros</Botao>
        </div>
      </Card>

      <section className="flex flex-col gap-[14px]">
        <h2 className="text-[17px] font-semibold text-[#2c3e50]">
          Categorias em destaque
        </h2>
        <div className="flex flex-wrap gap-[10px]">
          {categorias.map((c) => (
            <Chip key={c.id} onClick={() => buscarPorCategoria(c.id)}>
              {c.nome}
            </Chip>
          ))}
          <Chip onClick={() => navigate("/resultados")}>🔎 Ver todas</Chip>
        </div>
      </section>
    </>
  );
}
