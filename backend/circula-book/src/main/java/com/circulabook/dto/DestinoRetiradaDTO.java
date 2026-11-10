package com.circulabook.dto;

/**
 * Opção de "retirar em outra biblioteca" na tela de reserva
 * (GET /api/reservas/destinos). Bloqueada => {@code permitido=false} e o motivo.
 */
public record DestinoRetiradaDTO(Long bibliotecaId, String nome, boolean permitido, String motivo) {}
