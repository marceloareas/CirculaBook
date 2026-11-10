package com.circulabook.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Reserva = entrada na fila de espera de UMA biblioteca.
 *
 * bibliotecaFila    -> onde o usuário está na fila (de onde o exemplar sai)
 * bibliotecaDestino -> onde o usuário vai RETIRAR o exemplar.
 *                      Se for igual à da fila, não há transferência.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reserva")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "livro_id", nullable = false)
    private Livro livro;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "biblioteca_fila_id", nullable = false)
    private Biblioteca bibliotecaFila;

    @ManyToOne
    @JoinColumn(name = "biblioteca_destino_id", nullable = false)
    private Biblioteca bibliotecaDestino;

    // Exemplar separado para esta reserva (preenchido quando o 1º da fila é atendido)
    @ManyToOne
    @JoinColumn(name = "exemplar_id")
    private Exemplar exemplar;

    @Column
    private LocalDateTime dataReserva;

    @Column(nullable = false)
    private LocalDateTime dataExpiracao;

    // PENDENTE | AGUARDANDO_TRANSFERENCIA | DISPONIVEL | RETIRADA | CANCELADA | EXPIRADA
    @Column(nullable = false, length = 30)
    private String status;

    // Posição na fila (só PENDENTE); calculada ao criar a reserva, não é persistida
    @Transient
    private Integer posicaoFila;

    @PrePersist
    public void preencheDataReserva() {
        if (this.dataReserva == null) this.dataReserva = LocalDateTime.now();
    }
}