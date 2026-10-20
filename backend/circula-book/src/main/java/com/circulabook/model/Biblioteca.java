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
@Table(name = "biblioteca")
public class Biblioteca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String nome;

    @Column(length = 255)
    private String endereco;

    @Column(length = 255)
    private String email;

    @Column(length = 20)
    private String telefone;

    @Column(nullable = false)
    private Boolean ativa = true;

    @Column
    private LocalDateTime criadaEm;

    @PrePersist
    public void preencheCriadaEm() {
        if (this.criadaEm == null) this.criadaEm = LocalDateTime.now();
        if (this.ativa == null) this.ativa = true;
    }
}
