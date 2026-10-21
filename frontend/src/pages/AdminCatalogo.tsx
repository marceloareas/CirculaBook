/**
 * A8 — Catálogo de livros (só o Admin).
 * Tabela paginada com busca e formulário para criar/editar livro.
 * O ISBN é único: o servidor recusa repetição com mensagem clara.
 */
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { Categoria, Livro } from "../types";
import {
  AreaTexto, Botao, Campo, Entrada, Erro, SectionCard, Selecao, Sucesso,
  TituloPagina, Trilha, Carregando,
} from "../components/ui";
import TabelaPaginada, { type Coluna } from "../components/TabelaPaginada";
import ModalConfirmacao, { ResumoModal } from "../components/ModalConfirmacao";

interface Formulario {
  titulo: string;
  autor: string;
  isbn: string;
  editora: string;
  ano: string;
  categoriaId: string;
  sinopse: string;
}

const VAZIO: Formulario = {
  titulo: "", autor: "", isbn: "", editora: "", ano: "", categoriaId: "", sinopse: "",
};

export default function AdminCatalogo() {
  const [livros, setLivros] = useState<Livro[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<Formulario>(VAZIO);
  const [editando, setEditando] = useState<Livro | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function carregar() {
    Promise.all([api.get<Livro[]>("/livros"), api.get<Categoria[]>("/categorias")])
      .then(([l, c]) => {
        setLivros(l);
        setCategorias(c);
      })
      .catch((e) => setErro(e.message));
  }
  useEffect(carregar, []);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (livros ?? [])
      .filter(
        (l) =>
          !t ||
          l.titulo.toLowerCase().includes(t) ||
          l.autor.toLowerCase().includes(t) ||
          (l.isbn ?? "").toLowerCase().includes(t),
      )
      .sort((a, b) => a.titulo.localeCompare(b.titulo));
  }, [livros, busca]);

  function campo<K extends keyof Formulario>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function editar(l: Livro) {
    setEditando(l);
    setErro("");
    setSucesso("");
    setForm({
      titulo: l.titulo,
      autor: l.autor,
      isbn: l.isbn ?? "",
      editora: l.editora ?? "",
      ano: l.anoPublicacao ? String(l.anoPublicacao) : "",
      categoriaId: l.categoria ? String(l.categoria.id) : "",
      sinopse: l.sinopse ?? "",
    });
  }

  function limpar() {
    setEditando(null);
    setForm(VAZIO);
  }

  async function salvar() {
    setEnviando(true);
    setErro("");
    setSucesso("");
    const corpo = {
      titulo: form.titulo,
      autor: form.autor,
      isbn: form.isbn,
      editora: form.editora,
      anoPublicacao: form.ano ? Number(form.ano) : null,
      categoriaId: form.categoriaId ? Number(form.categoriaId) : null,
      sinopse: form.sinopse,
    };
    try {
      const livro = editando
        ? await api.put<Livro>(`/livros/${editando.id}`, corpo)
        : await api.post<Livro>("/livros", corpo);
      setSucesso(
        editando
          ? `Livro "${livro.titulo}" atualizado.`
          : `Livro "${livro.titulo}" cadastrado. Ele aparece na busca como "Indisponível: sem exemplares" até um bibliotecário cadastrar exemplares.`,
      );
      limpar();
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
      setConfirmando(false);
    }
  }

  const podeSalvar = form.titulo.trim() !== "" && form.autor.trim() !== "" && !enviando;
  const nomeCategoria = categorias.find((c) => String(c.id) === form.categoriaId)?.nome ?? "—";

  const colunas: Coluna<Livro>[] = [
    {
      titulo: "Título",
      render: (l) => (
        <div>
          <p className="font-semibold text-[#2c3e50]">{l.titulo}</p>
          <p className="text-[12px] text-[#66707d]">{l.autor}</p>
        </div>
      ),
    },
    { titulo: "ISBN", render: (l) => l.isbn || "—" },
    { titulo: "Categoria", render: (l) => l.categoria?.nome ?? "—" },
    { titulo: "Ano", render: (l) => l.anoPublicacao ?? "—" },
    {
      titulo: "Ação",
      className: "text-right",
      render: (l) => (
        <Botao variante="secundario" className="!px-3 !py-[6px] !text-[13px]" onClick={() => editar(l)}>
          Editar
        </Botao>
      ),
    },
  ];

  if (livros === null && !erro) return <Carregando texto="Carregando catálogo..." />;

  return (
    <>
      <Trilha voltarPara="/admin/transferencias" itens={[{ rotulo: "Catálogo de livros" }]} />
      <TituloPagina titulo="Catálogo de Livros" subtitulo="Cadastre e edite os títulos da rede" />

      {erro && <Erro mensagem={erro} />}
      {sucesso && <Sucesso mensagem={sucesso} />}

      <SectionCard
        titulo={editando ? `Editar livro: ${editando.titulo}` : "Novo livro"}
        acao={editando && <Botao variante="secundario" onClick={limpar}>Cancelar edição</Botao>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Campo label="Título">
            <Entrada value={form.titulo} onChange={(e) => campo("titulo", e.target.value)} />
          </Campo>
          <Campo label="Autor">
            <Entrada value={form.autor} onChange={(e) => campo("autor", e.target.value)} />
          </Campo>
          <Campo label="ISBN">
            <Entrada value={form.isbn} onChange={(e) => campo("isbn", e.target.value)} placeholder="978-65-00000-00-0" />
          </Campo>
          <Campo label="Editora">
            <Entrada value={form.editora} onChange={(e) => campo("editora", e.target.value)} />
          </Campo>
          <Campo label="Ano de publicação">
            <Entrada type="number" value={form.ano} onChange={(e) => campo("ano", e.target.value)} />
          </Campo>
          <Campo label="Categoria">
            <Selecao value={form.categoriaId} onChange={(e) => campo("categoriaId", e.target.value)}>
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Selecao>
          </Campo>
          <Campo label="Sinopse" className="md:col-span-2">
            <AreaTexto value={form.sinopse} onChange={(e) => campo("sinopse", e.target.value)} />
          </Campo>
        </div>
        <div className="mt-5 flex justify-end">
          <Botao disabled={!podeSalvar} onClick={() => setConfirmando(true)}>
            {editando ? "Salvar alterações" : "Cadastrar livro"}
          </Botao>
        </div>
      </SectionCard>

      <SectionCard titulo={`Livros cadastrados (${filtrados.length})`}>
        <Entrada
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="🔎 Buscar por título, autor ou ISBN..."
          aria-label="Buscar no catálogo"
        />
        <div className="mt-4 -mx-6">
          <TabelaPaginada dados={filtrados} colunas={colunas} chave={(l) => l.id} textoVazio="Nenhum livro encontrado." />
        </div>
      </SectionCard>

      <ModalConfirmacao
        aberto={confirmando}
        titulo={editando ? "Salvar alterações do livro?" : "Cadastrar livro?"}
        confirmarRotulo={editando ? "Salvar" : "Cadastrar"}
        carregando={enviando}
        onConfirmar={salvar}
        onCancelar={() => setConfirmando(false)}
      >
        <ResumoModal
          linhas={[
            ["Título", form.titulo],
            ["Autor", form.autor],
            ["ISBN", form.isbn || "—"],
            ["Categoria", nomeCategoria],
          ]}
        />
      </ModalConfirmacao>
    </>
  );
}
