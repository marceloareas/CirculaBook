import { Link, useParams } from "react-router-dom";
import { Header } from "../components/Header";

const books = {
  "dom-casmurro": {
    title: "Dom Casmurro",
    author: "Machado de Assis",
    genre: "Romance",
    publisher: "Editora Ática",
    year: "1899",
    isbn: "978-85-08-12345-6",
    synopsis:
      "Romance narrado por Bento Santiago, que revisita a própria juventude e o casamento com Capitu, questionando ao longo da obra se foi ou não traído por ela e pelo melhor amigo, Escobar.",
  },
};

const libraries = [
  {
    name: "Biblioteca Vila Isabel",
    address: "Rua A, 100 - Zona Norte",
    status: "2 exemplares disponíveis",
    action: "Retirar aqui",
    available: true,
  },
  {
    name: "Biblioteca Meier",
    address: "Rua C, 300 - Zona Oeste",
    status: "5 exemplares disponíveis",
    action: "Retirar aqui",
    available: true,
  },
  {
    name: "Biblioteca Tijuca",
    address: "Avenida B, 200 - Zona Sul",
    status: "0 exemplares disponíveis",
    action: "Entrar na fila",
  },
  {
    name: "Biblioteca Centro",
    address: "Praça D, 50 - Centro",
    status: "0 exemplares disponíveis",
    action: "Entrar na fila",
  },
];

export function BookDetailsPage() {
  const { slug } = useParams();
  const book = books[slug] || books["dom-casmurro"];

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-800">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-7">
        <nav
          className="mb-5 flex items-center gap-2 text-xs text-slate-400"
          aria-label="Navegação estrutural"
        >
          <Link className="hover:text-[#2563eb]" to="/">
            Buscar Livros
          </Link>
          <span aria-hidden="true">›</span>
          <span>Resultados</span>
          <span aria-hidden="true">›</span>
          <span className="font-medium text-slate-700">{book.title}</span>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[228px_minmax(0,1fr)]">
          <div>
            <div className="flex h-[313px] items-center justify-center rounded-md bg-[#6b9fc3] shadow-sm">
              <div className="relative h-16 w-12 rounded-[3px] bg-gradient-to-r from-[#a62650] to-[#ee2d68] shadow-md">
                <div className="absolute -bottom-1 left-0 h-1.5 w-full rounded-sm border-2 border-[#d62963] bg-[#81c0df]" />
              </div>
            </div>

            <dl className="mt-4 space-y-3 rounded-lg bg-white p-4 text-xs shadow-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Editora</dt>
                <dd className="font-medium">{book.publisher}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Ano de publicação</dt>
                <dd className="font-medium">{book.year}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">ISBN</dt>
                <dd className="font-medium">{book.isbn}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Categoria</dt>
                <dd className="font-medium">{book.genre}</dd>
              </div>
            </dl>
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
              {book.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{book.author}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">
                {book.genre}
              </span>
              <span className="rounded-full bg-[#dff5e7] px-3 py-1 font-medium text-[#39a86b]">
                ● Disponível
              </span>
              <span className="text-slate-500">em 1 biblioteca</span>
            </div>

            <div className="mt-5 max-w-2xl">
              <h2 className="text-xs font-semibold text-slate-800">Sinopse</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {book.synopsis}
              </p>
            </div>

            <section
              className="mt-4 rounded-lg bg-white p-4 shadow-sm sm:p-5"
              aria-labelledby="availability-title"
            >
              <h2
                id="availability-title"
                className="text-sm font-semibold text-slate-800"
              >
                Disponibilidade na rede
              </h2>

              <div className="mt-3 space-y-2">
                {libraries.map((library) => (
                  <div
                    key={library.name}
                    className="flex flex-col gap-3 rounded-lg bg-[#f5f7fa] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#275b8a]">
                        {library.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {library.address} · {library.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={
                        library.available
                          ? "shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-[#2563eb] hover:text-[#2563eb]"
                          : "shrink-0 rounded-md bg-[#1677d2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1266b5]"
                      }
                    >
                      {library.action}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
