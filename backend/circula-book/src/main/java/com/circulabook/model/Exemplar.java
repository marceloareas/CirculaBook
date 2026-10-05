package com.circulabook.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Cada linha é uma cópia física de um livro em uma biblioteca.
 * É o equivalente da tabela ESTOQUE do sistema-estoque-blackboard:
 * o "quadro" (blackboard) sobre o qual todos os especialistas atuam.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "exemplar")
public class Exemplar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "livro_id", nullable = false)
    private Livro livro;

    @ManyToOne
    @JoinColumn(name = "biblioteca_id", nullable = false)
    private Biblioteca biblioteca;

    // DISPONIVEL | EMPRESTADO | EMPRESTADO_RESERVADO | RESERVADO
    @Column(nullable = false, length = 30)
    private String status;

    @Column
    private LocalDateTime adicionadoEm;

    @PrePersist
    public void preencheAdicionadoEm() {
        if (this.adicionadoEm == null) this.adicionadoEm = LocalDateTime.now();
    }
}
