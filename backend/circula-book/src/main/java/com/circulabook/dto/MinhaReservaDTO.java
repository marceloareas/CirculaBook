package com.circulabook.dto;

import java.time.LocalDateTime;

/** Item de GET /api/reservas/minhas (só reservas ativas do usuário do token). */
public record MinhaReservaDTO(
    Long id, Long livroId, String titulo, String autor,
    Long bibliotecaId, String biblioteca,   // fila e retirada
    Integer posicao,                        // só quando PENDENTE
    String status,                          // PENDENTE | DISPONIVEL
    LocalDateTime dataReserva,
    LocalDateTime retireAte) {}             // só quando DISPONIVEL
