package com.circulabook.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String nome;

    @Column(nullable = false, length = 255, unique = true)
    private String email;

    // Hash BCrypt: nunca vai para o JSON
    @JsonIgnore
    @Column(nullable = false, length = 255)
    private String senhaHash;

    // COMUM | BIBLIOTECARIO | ADMIN
    @Column(nullable = false, length = 30)
    private String tipo;

    // Preenchido apenas quando tipo = BIBLIOTECARIO
    @ManyToOne
    @JoinColumn(name = "biblioteca_id")
    private Biblioteca biblioteca;

    @Column(nullable = false)
    private Boolean ativo = true;

    // RN12: data até a qual o usuário está impedido de novos empréstimos
    @Column
    private LocalDateTime bloqueadoAte;

    @Column
    private LocalDateTime criadoEm;

    @PrePersist
    public void preencheCriadoEm() {
        if (this.criadoEm == null) this.criadoEm = LocalDateTime.now();
        if (this.ativo == null) this.ativo = true;
    }
}
