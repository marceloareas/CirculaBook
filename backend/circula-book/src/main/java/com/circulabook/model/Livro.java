package com.circulabook.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "livro")
public class Livro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String titulo;

    @Column(nullable = false, length = 255)
    private String autor;

    @Column(length = 20, unique = true)
    private String isbn;

    @Column(length = 255)
    private String editora;

    @Column
    private Integer anoPublicacao;

    @Column(columnDefinition = "TEXT")
    private String sinopse;

    @ManyToOne
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;
}
