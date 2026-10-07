package com.circulabook.dto;

/** Corpo do POST /api/emprestimos/registrar (Tela 4). */
public class EmprestimoRequestDTO {

    private Long exemplarId;
    private Long usuarioId;

    public EmprestimoRequestDTO() {}

    public Long getExemplarId() { return exemplarId; }
    public void setExemplarId(Long exemplarId) { this.exemplarId = exemplarId; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
}
