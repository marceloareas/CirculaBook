package com.circulabook.dto;

/** Corpo do POST /api/emprestimos/devolver (Tela de Devolução). */
public class DevolucaoRequestDTO {

    private Long emprestimoId;

    public DevolucaoRequestDTO() {}

    public Long getEmprestimoId() { return emprestimoId; }
    public void setEmprestimoId(Long emprestimoId) { this.emprestimoId = emprestimoId; }
}
