package com.circulabook.dto;

/** Corpo do POST /api/reservas. */
public class ReservaRequestDTO {

    private Long livroId;
    private Long bibliotecaId;   // onde o usuário entra na fila e retira o exemplar

    public ReservaRequestDTO() {}

    public Long getLivroId() { return livroId; }
    public void setLivroId(Long livroId) { this.livroId = livroId; }

    public Long getBibliotecaId() { return bibliotecaId; }
    public void setBibliotecaId(Long bibliotecaId) { this.bibliotecaId = bibliotecaId; }
}
