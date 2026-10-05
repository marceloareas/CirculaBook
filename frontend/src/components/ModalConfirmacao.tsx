/** Modal de confirmação reutilizável para todas as transações do sistema. */
import { useEffect, type ReactNode } from "react";
import { Botao } from "./ui";

interface Props {
  aberto: boolean;
  titulo: string;
  children: ReactNode;
  confirmarRotulo?: string;
  /** null = esconde o botão (modal apenas informativo). */
  cancelarRotulo?: string | null;
  tom?: "normal" | "verde" | "perigo";
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ModalConfirmacao({
  aberto,
  titulo,
  children,
  confirmarRotulo = "Confirmar",
  cancelarRotulo = "Cancelar",
  tom = "normal",
  carregando = false,
  onConfirmar,
  onCancelar,
}: Props) {
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !carregando) onCancelar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, carregando, onCancelar]);

  if (!aberto) return null;

  const variante =
    tom === "perigo" ? "perigoSolido" : tom === "verde" ? "verde" : "primario";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => !carregando && onCancelar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-[12px] bg-white p-6 shadow-xl"
      >
        <h2
          id="modal-titulo"
          className="text-[18px] font-semibold text-[#2c3e50]"
        >
          {titulo}
        </h2>
        <div className="mt-3 text-[14px] leading-relaxed text-[#66707d] flex flex-col gap-3">
          {children}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          {cancelarRotulo !== null && (
            <Botao
              variante="secundario"
              onClick={onCancelar}
              disabled={carregando}
            >
              {cancelarRotulo}
            </Botao>
          )}
          <Botao
            variante={variante}
            onClick={onConfirmar}
            disabled={carregando}
          >
            {carregando ? "Processando..." : confirmarRotulo}
          </Botao>
        </div>
      </div>
    </div>
  );
}

/** Caixinha cinza com "rótulo ..... valor" para resumir a transação no modal. */
export function ResumoModal({ linhas }: { linhas: [string, ReactNode][] }) {
  return (
    <dl className="rounded-[8px] bg-[#f5f7fa] px-4 py-3 flex flex-col gap-2">
      {linhas.map(([rotulo, valor]) => (
        <div key={rotulo} className="flex justify-between gap-4 text-[13px]">
          <dt className="text-[#66707d]">{rotulo}</dt>
          <dd className="font-semibold text-[#2c3e50] text-right">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
