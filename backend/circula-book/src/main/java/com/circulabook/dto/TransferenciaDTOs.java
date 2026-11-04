package com.circulabook.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.List;

/** Payloads do ciclo de transferências (/api/transferencias). */
public final class TransferenciaDTOs {

    private TransferenciaDTOs() {}

    public record Ref(Long id, String nome) {}

    /** Situação da RN15 para a origem × título do pedido (o próprio pedido não conta contra si). */
    public record SituacaoOrigem(long total, long abertas, boolean permitido, String motivo) {}

    /**
     * Item de GET /api/transferencias/pedidos-pendentes (Admin).
     * exemplar: RETIDO (já separado na origem, aguardando a decisão) ou
     * VINCULADO_NA_DEVOLUCAO (ainda sem exemplar).
     */
    public record PedidoPendente(
        Long id, Long livroId, String titulo, String autor,
        Ref solicitante, Ref origem, Ref destino,
        Long reservaId, Long exemplarId, String exemplar, String descricaoExemplar,
        SituacaoOrigem rn15, String bloqueioDestino,
        LocalDateTime dataSolicitacao) {}

    /**
     * Linha de acompanhamento / "a receber" / "saindo".
     * tipo: RESERVA | AVULSA. etapa: o status, exceto APROVADA sem exemplar = APROVADA_AGUARDANDO_EXEMPLAR.
     */
    public record Transferencia(
        Long id, String tipo, String status, String etapa,
        Long livroId, String titulo, Long exemplarId,
        Ref origem, Ref destino, Ref solicitante, Ref aprovador,
        Long reservaId, String reservadoPara, String statusReserva,
        LocalDateTime dataSolicitacao, LocalDateTime dataConclusao, String observacoes) {}

    /** Corpo de POST /api/transferencias/avulsa. {@code exemplarId} isolado ainda é aceito. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AvulsaRequest(List<Long> exemplarIds, Long exemplarId, Long bibliotecaDestinoId,
                                String observacoes) {}
}
