package com.circulabook.dto;

/** Corpo do POST /api/emprestimos/devolver (Tela 6). */
public class DevolucaoRequestDTO {

    private Long emprestimoId;
    private String condicaoExemplar; // BOM | DANIFICADO

    public DevolucaoRequestDTO() {}

    public Long getEmprestimoId() { return emprestimoId; }
    public void setEmprestimoId(Long emprestimoId) { this.emprestimoId = emprestimoId; }

    public String getCondicaoExemplar() { return condicaoExemplar; }
    public void setCondicaoExemplar(String condicaoExemplar) { this.condicaoExemplar = condicaoExemplar; }
}
