package com.circulabook.dto;

/** Corpo do POST /api/reservas (Tela de Reserva). */
public class ReservaRequestDTO {

    private Long livroId;
    private Long bibliotecaFilaId;      // onde o usuário entra na fila
    private Long bibliotecaDestinoId;   // onde o usuário vai retirar

    public ReservaRequestDTO() {}

    public Long getLivroId() { return livroId; }
    public void setLivroId(Long livroId) { this.livroId = livroId; }

    public Long getBibliotecaFilaId() { return bibliotecaFilaId; }
    public void setBibliotecaFilaId(Long bibliotecaFilaId) { this.bibliotecaFilaId = bibliotecaFilaId; }

    public Long getBibliotecaDestinoId() { return bibliotecaDestinoId; }
    public void setBibliotecaDestinoId(Long bibliotecaDestinoId) { this.bibliotecaDestinoId = bibliotecaDestinoId; }
}
