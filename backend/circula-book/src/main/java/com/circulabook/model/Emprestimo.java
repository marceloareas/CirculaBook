package com.circulabook.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "emprestimo")
public class Emprestimo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "exemplar_id", nullable = false)
    private Exemplar exemplar;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "biblioteca_id", nullable = false)
    private Biblioteca biblioteca;

    @Column
    private LocalDateTime dataEmprestimo;

    @Column(nullable = false)
    private LocalDateTime dataPrevDevolucao;

    // NULL enquanto não devolvido
    @Column
    private LocalDateTime dataDevolucao;

    // ATIVO | DEVOLVIDO | ATRASADO
    @Column(nullable = false, length = 30)
    private String status;

    @PrePersist
    public void preencheDataEmprestimo() {
        if (this.dataEmprestimo == null) this.dataEmprestimo = LocalDateTime.now();
    }
}
