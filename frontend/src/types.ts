// Espelha os DTOs e entidades devolvidos pelo backend Spring Boot.

export type Perfil = "COMUM" | "BIBLIOTECARIO" | "ADMIN";

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
  ativo: boolean;
  bloqueadoAte?: string | null;
}

export interface Biblioteca {
  id: number;
  nome: string;
  endereco?: string;
  email?: string;
  telefone?: string;
  ativa?: boolean;
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
    | "RESERVADO"
    | "EM_TRANSFERENCIA";
  /** NOVO | BOM | USADO */
  estadoConservacao?: string;
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
  /** Biblioteca onde o usuário está na fila (de onde o exemplar sai). */
  bibliotecaFila: Biblioteca;
  /** Biblioteca onde o usuário vai retirar (igual à da fila = sem transferência). */
  bibliotecaDestino: Biblioteca;
  /** Exemplar separado quando o 1º da fila é atendido. */
  exemplar?: Exemplar | null;
  dataReserva: string;
  dataExpiracao: string;
  /** Posição na fila (devolvida ao criar a reserva). */
  posicaoFila?: number | null;
  status:
    | "PENDENTE"
    | "AGUARDANDO_TRANSFERENCIA"
    | "DISPONIVEL"
    | "RETIRADA"
    | "EXPIRADA"
    | "CANCELADA";
}

/** Etapa do pedido de transferência de uma reserva (GET /api/reservas/minhas). */
export interface TransferenciaDaReserva {
  id: number;
  status: SolicitacaoTransferencia["status"];
  etapa:
    | "PENDENTE"
    | "PENDENTE_COM_EXEMPLAR"
    | "APROVADA_AGUARDANDO_EXEMPLAR"
    | "EM_TRANSITO"
    | "CONCLUIDA"
    | "REJEITADA"
    | "CANCELADA";
  descricao: string;
}

/** Item de GET /api/reservas/minhas (só reservas ativas do usuário do token). */
export interface MinhaReserva {
  id: number;
  livroId: number;
  titulo: string;
  autor: string;
  bibliotecaFilaId: number;
  bibliotecaFila: string;
  bibliotecaRetiradaId: number;
  bibliotecaRetirada: string;
  /** Só quando PENDENTE. */
  posicao: number | null;
  status: "PENDENTE" | "AGUARDANDO_TRANSFERENCIA" | "DISPONIVEL";
  dataReserva: string;
  /** Só quando DISPONIVEL. */
  retireAte: string | null;
  /** Null quando a retirada sempre foi na própria biblioteca da fila. */
  transferencia: TransferenciaDaReserva | null;
}

export interface MeuEmprestimo {
  id: number;
  exemplarId: number;
  livroId: number;
  titulo: string;
  autor: string;
  bibliotecaId: number;
  biblioteca: string;
  dataEmprestimo: string;
  dataPrevDevolucao: string;
  diasAtraso: number;
  atrasado: boolean;
}

/** GET /api/conta/emprestimos. */
export interface MeusEmprestimos {
  emprestimos: MeuEmprestimo[];
  total: number;
  limite: number;
  bloqueado: boolean;
  bloqueadoAte: string | null;
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

/** Item de GET /api/reservas/destinos e /api/transferencias/destinos-avulsa. */
export interface DestinoRetirada {
  bibliotecaId: number;
  nome: string;
  permitido: boolean;
  /** Por que a biblioteca não pode ser escolhida (null quando permitida). */
  motivo: string | null;
}

export interface SolicitacaoTransferencia {
  id: number;
  /** Título sempre disponível, mesmo sem exemplar vinculado. */
  livro: Livro;
  /** Nulo enquanto a transferência "aguarda exemplar". */
  exemplar: Exemplar | null;
  bibliotecaOrigem: Biblioteca;
  bibliotecaDestino: Biblioteca;
  solicitante: Usuario;
  aprovador?: Usuario | null;
  reserva?: Reserva | null;
  status:
    | "PENDENTE"
    | "APROVADA"
    | "EM_TRANSITO"
    | "CONCLUIDA"
    | "REJEITADA"
    | "CANCELADA";
  dataSolicitacao: string;
  dataConclusao?: string | null;
  observacoes?: string;
}

/** Resposta de GET /api/transferencias/resumo. */
export interface ResumoTransferencias {
  pendentes: number;
  aguardandoExemplar: number;
  emTransito: number;
  concluidas: number;
  rejeitadas: number;
}

/** Página do backend (pagina começa em 0). */
export interface Pagina<T> {
  itens: T[];
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
}

/** Referência curta (id + nome) usada nos DTOs de transferência. */
export interface Ref {
  id: number;
  nome: string;
}

/** Item de GET /api/transferencias/pedidos-pendentes (Admin). */
export interface PedidoPendente {
  id: number;
  livroId: number;
  titulo: string;
  autor: string;
  solicitante: Ref;
  origem: Ref;
  destino: Ref;
  reservaId: number | null;
  exemplarId: number | null;
  /** RETIDO = exemplar já separado na origem; senão será vinculado na devolução. */
  exemplar: "RETIDO" | "VINCULADO_NA_DEVOLUCAO";
  descricaoExemplar: string;
  /** Capacidade da origem: o próprio pedido não conta contra si. */
  rn15: { total: number; abertas: number; permitido: boolean; motivo: string | null };
  /** Motivo de o destino não poder receber (null = pode). */
  bloqueioDestino: string | null;
  dataSolicitacao: string;
}

export type EtapaTransferencia =
  | "PENDENTE"
  | "APROVADA"
  | "APROVADA_AGUARDANDO_EXEMPLAR"
  | "EM_TRANSITO"
  | "CONCLUIDA"
  | "REJEITADA"
  | "CANCELADA";

/** Linha de acompanhamento, "a receber" e "saindo". */
export interface TransferenciaResumo {
  id: number;
  tipo: "RESERVA" | "AVULSA";
  status: SolicitacaoTransferencia["status"];
  etapa: EtapaTransferencia;
  livroId: number;
  titulo: string;
  exemplarId: number | null;
  origem: Ref;
  destino: Ref;
  solicitante: Ref | null;
  aprovador: Ref | null;
  reservaId: number | null;
  /** Nome de quem vai retirar, enquanto a reserva estiver ativa. */
  reservadoPara: string | null;
  statusReserva: Reserva["status"] | null;
  dataSolicitacao: string;
  dataConclusao: string | null;
  observacoes: string | null;
}
