/** Moldura comum: header azul + área de conteúdo com fundo cinza. */
import type { ReactNode } from "react";
import Header from "./Header";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header />
      <main className="max-w-[1440px] mx-auto px-10 py-8 flex flex-col gap-7">
        {children}
      </main>
    </div>
  );
}
