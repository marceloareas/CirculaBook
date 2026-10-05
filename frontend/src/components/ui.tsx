/**
 * Biblioteca de componentes visuais do Circula Book.
 *
 * Cada componente reproduz um elemento do protótipo do Figma:
 * mesmas cores (#1976d2, #f5f7fa, #e0e0e0...), mesmos raios (8px em
 * controles, 12px em cards) e a mesma sombra 0 2px 10px rgba(0,0,0,.08).
 * Centralizar aqui evita repetir classes Tailwind em oito telas.
 */
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

/* ─────────────── Card branco (o contêiner padrão das telas) ─────────────── */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-[12px] shadow-[0_2px_10px_rgba(0,0,0,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

/** Card com título numerado, como "1. Buscar exemplar". */
export function SectionCard({
  titulo,
  children,
  acao,
}: {
  titulo: string;
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold text-[#2c3e50]">{titulo}</h2>
        {acao}
      </div>
      {children}
    </Card>
  );
}

/* ─────────────── Badges de status ─────────────── */
type Tom = "verde" | "amarelo" | "vermelho" | "azul" | "cinza";

const TONS: Record<Tom, string> = {
  verde: "bg-[#dbf0db] text-[#388e3c]",
  amarelo: "bg-[#ffecd0] text-[#f57c00]",
  vermelho: "bg-[#fce5e5] text-[#d32f2f]",
  azul: "bg-[#deedfc] text-[#125ca8]",
  cinza: "bg-[#eceff3] text-[#66707d]",
};

export function Badge({
  tom = "cinza",
  children,
}: {
  tom?: Tom;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block px-3 py-[5px] rounded-full text-[12px] font-semibold ${TONS[tom]}`}
    >
      {children}
    </span>
  );
}

/** Traduz a situação de um título no acervo para o badge correspondente. */
export function BadgeSituacao({ situacao }: { situacao: string }) {
  if (situacao === "DISPONIVEL")
    return <Badge tom="verde">🟢 Disponível</Badge>;
  if (situacao === "AGUARDANDO")
    return <Badge tom="amarelo">🟡 Aguardando</Badge>;
  return <Badge tom="vermelho">🔴 Indisponível: sem exemplares</Badge>;
}

/* ─────────────── Caixas de alerta da coluna lateral ─────────────── */
export function Callout({
  tipo,
  titulo,
  children,
}: {
  tipo: "info" | "aviso" | "sucesso";
  titulo: string;
  children: ReactNode;
}) {
  const estilos = {
    info: { box: "bg-[#deedfc] border-[#1976d2] text-[#125ca8]", icone: "ℹ️" },
    aviso: { box: "bg-[#ffecd0] border-[#f57c00] text-[#c76400]", icone: "⚠️" },
    sucesso: {
      box: "bg-[#dbf0db] border-[#388e3c] text-[#2b6e2e]",
      icone: "✅",
    },
  }[tipo];

  return (
    <div
      className={`flex gap-3 border rounded-[10px] px-[18px] py-[14px] ${estilos.box}`}
    >
      <span aria-hidden className="text-[18px] leading-none pt-[2px]">
        {estilos.icone}
      </span>
      <div>
        <p className="text-[14px] font-semibold">{titulo}</p>
        <p className="text-[13px] leading-[1.45] mt-[2px]">{children}</p>
      </div>
    </div>
  );
}

/* ─────────────── Botões ─────────────── */
export function Botao({
  children,
  onClick,
  variante = "primario",
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "primario" | "secundario" | "verde" | "perigo" | "perigoSolido";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const variantes = {
    primario: "bg-[#1976d2] text-white hover:bg-[#125ca8]",
    secundario:
      "bg-[#f5f7fa] text-[#2c3e50] border border-[#e0e0e0] hover:bg-[#eceff3]",
    verde: "bg-[#388e3c] text-white hover:bg-[#2b6e2e]",
    perigo:
      "bg-white text-[#d32f2f] border border-[#d32f2f] hover:bg-[#fce5e5]",
    perigoSolido: "bg-[#d32f2f] text-white hover:bg-[#b02424]",
  }[variante];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[8px]
                  text-[14px] font-semibold transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed ${variantes} ${className}`}
    >
      {children}
    </button>
  );
}

/* ─────────────── Campos de formulário ─────────────── */
export function Campo({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-[6px] ${className}`}>
      <span className="text-[13px] font-medium text-[#66707d]">{label}</span>
      {children}
    </label>
  );
}

const ENTRADA =
  "h-11 w-full rounded-[8px] border border-[#e0e0e0] bg-white px-[14px] " +
  "text-[14px] text-[#2c3e50] placeholder:text-[#9aa3ad]";

export function Entrada(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${ENTRADA} ${props.className ?? ""}`} />;
}

export function Selecao(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${ENTRADA} ${props.className ?? ""}`} />
  );
}

/** Chip clicável usado em "Categorias em destaque" e nos filtros aplicados. */
export function Chip({
  children,
  onClick,
  ativo,
}: {
  children: ReactNode;
  onClick?: () => void;
  ativo?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors
        ${ativo ? "bg-[#1976d2] text-white" : "bg-[#e8f0fc] text-[#125ca8] hover:bg-[#d7e6fa]"}`}
    >
      {children}
    </button>
  );
}

/* ─────────────── Peças menores ─────────────── */

/** Retângulo colorido com o emoji de livro, no lugar da capa. */
export function CapaLivro({
  tamanho = "md",
}: {
  tamanho?: "sm" | "md" | "lg";
}) {
  const dims = {
    sm: "w-[52px] h-[72px] text-[22px]",
    md: "w-[72px] h-[100px] text-[32px]",
    lg: "w-full h-[440px] text-[90px]",
  }[tamanho];
  return (
    <div
      className={`${dims} shrink-0 rounded-[8px] bg-[#6699bf] flex items-center justify-center`}
    >
      <span aria-hidden>📕</span>
    </div>
  );
}

/** Linha "rótulo .... valor" usada em todos os cards de resumo. */
export function LinhaResumo({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: ReactNode;
  destaque?: "verde" | "vermelho" | "laranja" | "azul";
}) {
  const cor = destaque
    ? {
        verde: "text-[#388e3c]",
        vermelho: "text-[#d32f2f]",
        laranja: "text-[#f57c00]",
        azul: "text-[#125ca8]",
      }[destaque]
    : "text-[#2c3e50]";
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] text-[#66707d]">{rotulo}</span>
      <span className={`text-[13px] font-semibold text-right ${cor}`}>
        {valor}
      </span>
    </div>
  );
}

/** Card de resumo da coluna direita, com as linhas e o botão de ação. */
export function CardResumo({
  titulo,
  children,
  rodape,
}: {
  titulo: string;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  return (
    <Card className="p-6">
      <h3 className="text-[15px] font-semibold text-[#2c3e50] mb-4">
        {titulo}
      </h3>
      <div className="flex flex-col gap-[14px]">{children}</div>
      {rodape && <div className="mt-4">{rodape}</div>}
    </Card>
  );
}

/**
 * Botão "← Voltar". Volta uma página no histórico; se a tela foi aberta
 * direto pela URL (sem histórico), vai para `para`.
 */
export function BotaoVoltar({ para = "/" }: { para?: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  function voltar() {
    // key === "default" significa que esta é a primeira página da sessão
    if (location.key !== "default") navigate(-1);
    else navigate(para);
  }

  return (
    <button
      type="button"
      onClick={voltar}
      className="inline-flex items-center gap-1 rounded-[8px] border border-[#e0e0e0]
                 bg-white px-3 py-[6px] text-[13px] font-medium text-[#2c3e50]
                 hover:bg-[#eceff3] transition-colors"
    >
      ← Voltar
    </button>
  );
}

/** Barra de navegação de cada tela: botão Voltar + trilha "Início › Resultados › ...". */
export function Trilha({
  itens,
  voltarPara = "/",
}: {
  itens: { rotulo: string; to?: string }[];
  voltarPara?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <BotaoVoltar para={voltarPara} />
      <nav
        aria-label="Trilha de navegação"
        className="flex items-center gap-2 text-[13px]"
      >
        {itens.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-[#66707d]" aria-hidden>
                ›
              </span>
            )}
            {item.to ? (
              <Link
                to={item.to}
                className="text-[#66707d] hover:text-[#1976d2]"
              >
                {item.rotulo}
              </Link>
            ) : (
              <span className="text-[#2c3e50] font-semibold">
                {item.rotulo}
              </span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}

/** Título grande da página + subtítulo com o código do caso de uso. */
export function TituloPagina({
  titulo,
  subtitulo,
}: {
  titulo: string;
  subtitulo: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-[28px] font-bold text-[#2c3e50] leading-tight">
        {titulo}
      </h1>
      <p className="text-[15px] text-[#66707d]">{subtitulo}</p>
    </div>
  );
}

/** Estados de carregamento, erro e vazio — padronizados. */
export function Carregando({ texto = "Carregando..." }: { texto?: string }) {
  return <p className="py-8 text-center text-[14px] text-[#66707d]">{texto}</p>;
}

export function Erro({ mensagem }: { mensagem: string }) {
  return (
    <div className="rounded-[8px] border border-[#d32f2f] bg-[#fce5e5] px-4 py-3 text-[14px] text-[#d32f2f]">
      {mensagem}
    </div>
  );
}

export function Sucesso({ mensagem }: { mensagem: string }) {
  return (
    <div className="rounded-[8px] border border-[#388e3c] bg-[#dbf0db] px-4 py-3 text-[14px] text-[#2b6e2e]">
      {mensagem}
    </div>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return (
    <div className="rounded-[10px] bg-[#f5f7fa] px-4 py-8 text-center text-[14px] text-[#66707d]">
      {texto}
    </div>
  );
}

/** Layout de duas colunas: conteúdo à esquerda, alertas/resumo à direita. */
export function DuasColunas({
  esquerda,
  direita,
}: {
  esquerda: ReactNode;
  direita: ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-5 w-full">
        {esquerda}
      </div>
      <aside className="w-full lg:w-[360px] shrink-0 flex flex-col gap-4">
        {direita}
      </aside>
    </div>
  );
}
