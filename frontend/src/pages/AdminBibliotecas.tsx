/**
 * A5 — Bibliotecas (só o Admin): listar, criar, editar e desativar/reativar.
 * Desativar apenas marca a biblioteca como inativa.
 */
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { Biblioteca } from "../types";
import {
  Badge, Botao, Campo, Carregando, Entrada, Erro, SectionCard, Sucesso,
  TituloPagina, Trilha,
} from "../components/ui";
import TabelaPaginada, { type Coluna } from "../components/TabelaPaginada";
import ModalConfirmacao, { ResumoModal } from "../components/ModalConfirmacao";

interface Formulario {
  nome: string;
  endereco: string;
  email: string;
  telefone: string;
}

const VAZIO: Formulario = { nome: "", endereco: "", email: "", telefone: "" };

/** Ação pendente de confirmação no modal. */
type Pendente =
  | { tipo: "salvar" }
  | { tipo: "desativar" | "ativar"; biblioteca: Biblioteca };

export default function AdminBibliotecas() {
  const [bibliotecas, setBibliotecas] = useState<Biblioteca[] | null>(null);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<Formulario>(VAZIO);
  const [editando, setEditando] = useState<Biblioteca | null>(null);
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function carregar() {
    api.get<Biblioteca[]>("/bibliotecas/todas").then(setBibliotecas).catch((e) => setErro(e.message));
  }
  useEffect(carregar, []);

  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (bibliotecas ?? [])
      .filter((b) => !t || b.nome.toLowerCase().includes(t) || (b.endereco ?? "").toLowerCase().includes(t))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [bibliotecas, busca]);

  function campo<K extends keyof Formulario>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function editar(b: Biblioteca) {
    setEditando(b);
    setForm({ nome: b.nome, endereco: b.endereco ?? "", email: b.email ?? "", telefone: b.telefone ?? "" });
    setErro("");
    setSucesso("");
  }

  function limpar() {
    setEditando(null);
    setForm(VAZIO);
  }

  async function confirmar() {
    if (!pendente) return;
    setEnviando(true);
    setErro("");
    setSucesso("");
    try {
      if (pendente.tipo === "salvar") {
        const b = editando
          ? await api.put<Biblioteca>(`/bibliotecas/${editando.id}`, form)
          : await api.post<Biblioteca>("/bibliotecas", form);
        setSucesso(editando ? `${b.nome} atualizada.` : `${b.nome} cadastrada.`);
        limpar();
      } else {
        const b = await api.patch<Biblioteca>(`/bibliotecas/${pendente.biblioteca.id}/${pendente.tipo}`);
        setSucesso(pendente.tipo === "desativar" ? `${b.nome} desativada.` : `${b.nome} reativada.`);
      }
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
      setPendente(null);
    }
  }

  const colunas: Coluna<Biblioteca>[] = [
    {
      titulo: "Biblioteca",
      render: (b) => (
        <div>
          <p className="font-semibold text-[#2c3e50]">{b.nome}</p>
          <p className="text-[12px] text-[#66707d]">{b.endereco || "—"}</p>
        </div>
      ),
    },
    {
      titulo: "Contato",
      render: (b) => (
        <div className="text-[13px]">
          <p>{b.email || "—"}</p>
          <p className="text-[#66707d]">{b.telefone || ""}</p>
        </div>
      ),
    },
    {
      titulo: "Situação",
      render: (b) => (b.ativa === false ? <Badge tom="cinza">Inativa</Badge> : <Badge tom="verde">Ativa</Badge>),
    },
    {
      titulo: "Ações",
      className: "text-right",
      render: (b) => (
        <div className="flex justify-end gap-2">
          <Botao variante="secundario" className="!px-3 !py-[6px] !text-[13px]" onClick={() => editar(b)}>
            Editar
          </Botao>
          {b.ativa === false ? (
            <Botao variante="secundario" className="!px-3 !py-[6px] !text-[13px]"
                   onClick={() => setPendente({ tipo: "ativar", biblioteca: b })}>
              Reativar
            </Botao>
          ) : (
            <Botao variante="perigo" className="!px-3 !py-[6px] !text-[13px]"
                   onClick={() => setPendente({ tipo: "desativar", biblioteca: b })}>
              Desativar
            </Botao>
          )}
        </div>
      ),
    },
  ];

  if (bibliotecas === null && !erro) return <Carregando texto="Carregando bibliotecas..." />;

  const tituloModal =
    pendente?.tipo === "salvar"
      ? editando ? "Salvar alterações da biblioteca?" : "Cadastrar biblioteca?"
      : pendente?.tipo === "desativar" ? "Desativar biblioteca?" : "Reativar biblioteca?";

  return (
    <>
      <Trilha voltarPara="/admin/catalogo" itens={[{ rotulo: "Bibliotecas" }]} />
      <TituloPagina titulo="Bibliotecas" subtitulo="Unidades da rede de bibliotecas comunitárias" />

      {erro && <Erro mensagem={erro} />}
      {sucesso && <Sucesso mensagem={sucesso} />}

      <SectionCard
        titulo={editando ? `Editar: ${editando.nome}` : "Nova biblioteca"}
        acao={editando && <Botao variante="secundario" onClick={limpar}>Cancelar edição</Botao>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Campo label="Nome">
            <Entrada value={form.nome} onChange={(e) => campo("nome", e.target.value)} />
          </Campo>
          <Campo label="Endereço">
            <Entrada value={form.endereco} onChange={(e) => campo("endereco", e.target.value)} />
          </Campo>
          <Campo label="E-mail">
            <Entrada type="email" value={form.email} onChange={(e) => campo("email", e.target.value)} />
          </Campo>
          <Campo label="Telefone">
            <Entrada value={form.telefone} onChange={(e) => campo("telefone", e.target.value)} />
          </Campo>
        </div>
        <div className="mt-5 flex justify-end">
          <Botao disabled={!form.nome.trim() || enviando} onClick={() => setPendente({ tipo: "salvar" })}>
            {editando ? "Salvar alterações" : "Cadastrar biblioteca"}
          </Botao>
        </div>
      </SectionCard>

      <SectionCard titulo={`Bibliotecas da rede (${filtradas.length})`}>
        <Entrada
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="🔎 Buscar por nome ou endereço..."
          aria-label="Buscar biblioteca"
        />
        <div className="mt-4 -mx-6">
          <TabelaPaginada dados={filtradas} colunas={colunas} chave={(b) => b.id} textoVazio="Nenhuma biblioteca encontrada." />
        </div>
      </SectionCard>

      <ModalConfirmacao
        aberto={!!pendente}
        titulo={tituloModal}
        confirmarRotulo={pendente?.tipo === "desativar" ? "Desativar" : "Confirmar"}
        tom={pendente?.tipo === "desativar" ? "perigo" : "normal"}
        carregando={enviando}
        onConfirmar={confirmar}
        onCancelar={() => setPendente(null)}
      >
        {pendente?.tipo === "salvar" ? (
          <ResumoModal
            linhas={[
              ["Nome", form.nome],
              ["Endereço", form.endereco || "—"],
              ["E-mail", form.email || "—"],
              ["Telefone", form.telefone || "—"],
            ]}
          />
        ) : pendente ? (
          <p>
            {pendente.tipo === "desativar"
              ? `A ${pendente.biblioteca.nome} será marcada como inativa e deixará de aparecer na escolha de bibliotecas dos formulários. O acervo e os registros não são alterados.`
              : `A ${pendente.biblioteca.nome} voltará a ficar ativa na rede.`}
          </p>
        ) : null}
      </ModalConfirmacao>
    </>
  );
}
