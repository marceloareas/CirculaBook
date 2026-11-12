package com.circulabook.dto;

import java.time.LocalDateTime;

/** Item de GET /api/reservas/minhas (só reservas ativas do usuário do token). */
public record MinhaReservaDTO(
    Long id, Long livroId, String titulo, String autor,
    Long bibliotecaFilaId, String bibliotecaFila,
    Long bibliotecaRetiradaId, String bibliotecaRetirada,
    Integer posicao,                        // só quando PENDENTE
    String status,                          // PENDENTE | AGUARDANDO_TRANSFERENCIA | DISPONIVEL
    LocalDateTime dataReserva,
    LocalDateTime retireAte,                // só quando DISPONIVEL
    TransferenciaDaReserva transferencia) { // null quando a retirada sempre foi na própria fila

    /**
     * Situação do pedido de transferência de uma reserva.
     * etapa: PENDENTE | PENDENTE_COM_EXEMPLAR | APROVADA_AGUARDANDO_EXEMPLAR | EM_TRANSITO
     *        | CONCLUIDA | REJEITADA | CANCELADA
     */
    public record TransferenciaDaReserva(Long id, String status, String etapa, String descricao) {}
}
