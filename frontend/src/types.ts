// Espelha os DTOs e entidades devolvidos pelo backend Spring Boot.

export type Perfil = "COMUM" | "BIBLIOTECARIO";

/** Usuário da sessão, como devolvido por /api/auth/login e /me. */
export interface UsuarioSessao {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  bibliotecaId: number | null;
  bibliotecaNome: string | null;
}

/** Resposta de /api/auth/login. */
export interface Sessao {
  token: string;
  expiraEm: string;
  usuario: UsuarioSessao;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: Perfil;
  biblioteca?: Biblioteca | null;
  bloqueadoAte?: string | null;
}

export interface Biblioteca {
  id: number;
  nome: string;
  endereco?: string;
  email?: string;
  telefone?: string;
}

export interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
}

export interface Livro {
  id: number;
  titulo: string;
  autor: string;
  isbn?: string;
  editora?: string;
  anoPublicacao?: number;
  sinopse?: string;
  categoria?: Categoria | null;
}

export interface Exemplar {
  id: number;
  livro: Livro;
  biblioteca: Biblioteca;
  status:
    | "DISPONIVEL"
    | "EMPRESTADO"
    /** Emprestado e há fila do título nesta biblioteca. */
    | "EMPRESTADO_RESERVADO"
    | "RESERVADO";
}

export interface Disponibilidade {
  bibliotecaId: number;
  bibliotecaNome: string;
  endereco?: string;
  totalExemplares: number;
  disponiveis: number;
}

/** DTO da busca e dos detalhes do livro. */
export interface LivroResumo {
  id: number;
  titulo: string;
  autor: string;
  editora?: string;
  isbn?: string;
  anoPublicacao?: number;
  categoria?: string;
  sinopse?: string;
  totalExemplares: number;
  disponiveis: number;
  bibliotecasComDisponivel: number;
  naFilaDeEspera: number;
  situacao: "DISPONIVEL" | "AGUARDANDO" | "INDISPONIVEL";
  disponibilidade?: Disponibilidade[];
}

export interface Emprestimo {
  id: number;
  exemplar: Exemplar;
  usuario: Usuario;
  biblioteca: Biblioteca;
  dataEmprestimo: string;
  dataPrevDevolucao: string;
  dataDevolucao?: string | null;
  status: "ATIVO" | "DEVOLVIDO" | "ATRASADO";
}

export interface Reserva {
  id: number;
  livro: Livro;
  usuario: Usuario;
  /** Biblioteca da fila, onde também é feita a retirada. */
  bibliotecaFila: Biblioteca;
  /** Exemplar separado quando o 1º da fila é atendido. */
  exemplar?: Exemplar | null;
  dataReserva: string;
  dataExpiracao: string;
  /** Posição na fila (devolvida ao criar a reserva). */
  posicaoFila?: number | null;
  status: "PENDENTE" | "DISPONIVEL" | "RETIRADA" | "EXPIRADA" | "CANCELADA";
}

/** Item de GET /api/reservas/minhas (só reservas ativas do usuário do token). */
export interface MinhaReserva {
  id: number;
  livroId: number;
  titulo: string;
  autor: string;
  /** Biblioteca da fila, onde também é feita a retirada. */
  bibliotecaId: number;
  biblioteca: string;
  /** Só quando PENDENTE. */
  posicao: number | null;
  status: "PENDENTE" | "DISPONIVEL";
  dataReserva: string;
  /** Só quando DISPONIVEL. */
  retireAte: string | null;
}

/** Resposta de /api/emprestimos/situacao/{id} — alimenta os alertas da tela de empréstimo. */
export interface SituacaoUsuario {
  usuarioId: number;
  nome: string;
  email: string;
  emprestimosAtivos: number;
  limite: number;
  bloqueado: boolean;
  bloqueadoAte?: string | null;
  apto: boolean;
  motivo: string;
}
