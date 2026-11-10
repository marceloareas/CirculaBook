package com.circulabook.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Pedido de transferência de exemplar entre bibliotecas.
 *
 * Só nasce de duas formas:
 *  (a) a partir de uma RESERVA com retirada em outra biblioteca
 *      -> nasce PENDENTE e SEM exemplar (ele é vinculado quando for devolvido);
 *  (b) avulsa, criada pelo ADMIN -> nasce aprovada e já com exemplar.
 *
 * APROVADA com exemplar == null significa "aprovada, aguardando exemplar".
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "solicitacao_transferencia")
public class SolicitacaoTransferencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "livro_id", nullable = false)
    private Livro livro;

    // Nulo enquanto o pedido aguarda a devolução de um exemplar na origem
    @ManyToOne
    @JoinColumn(name = "exemplar_id")
    private Exemplar exemplar;

    @ManyToOne
    @JoinColumn(name = "biblioteca_origem_id", nullable = false)
    private Biblioteca bibliotecaOrigem;

    @ManyToOne
    @JoinColumn(name = "biblioteca_destino_id", nullable = false)
    private Biblioteca bibliotecaDestino;

    @ManyToOne
    @JoinColumn(name = "solicitante_id", nullable = false)
    private Usuario solicitante;

    @ManyToOne
    @JoinColumn(name = "aprovador_id")
    private Usuario aprovador;

    @ManyToOne
    @JoinColumn(name = "reserva_id")
    private Reserva reserva;

    // PENDENTE | APROVADA | EM_TRANSITO | CONCLUIDA | REJEITADA | CANCELADA
    @Column(nullable = false, length = 30)
    private String status = "PENDENTE";

    @Column
    private LocalDateTime dataSolicitacao;

    @Column
    private LocalDateTime dataConclusao;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    // Motivo informado pelo Admin ao rejeitar (mostrado ao usuário em "Minhas reservas")
    @Column(columnDefinition = "TEXT")
    private String motivoRejeicao;

    @PrePersist
    public void preencheDataSolicitacao() {
        if (this.dataSolicitacao == null) this.dataSolicitacao = LocalDateTime.now();
    }
}
