package com.circulabook.dto;

/**
 * Corpo do POST /api/exemplares (B4).
 * Só livro já cadastrado; a biblioteca é a do bibliotecário logado
 * (se bibliotecaId vier e for outra, a requisição é recusada com 403).
 */
public class CadastroExemplarDTO {

    private Long livroId;
    private Long bibliotecaId;   // opcional
    private String conservacao;  // NOVO | BOM | USADO (padrão NOVO)
    private Integer quantidade;  // pelo menos 1 (padrão 1)

    public CadastroExemplarDTO() {}

    public Long getLivroId() { return livroId; }
    public void setLivroId(Long livroId) { this.livroId = livroId; }

    public Long getBibliotecaId() { return bibliotecaId; }
    public void setBibliotecaId(Long bibliotecaId) { this.bibliotecaId = bibliotecaId; }

    public String getConservacao() { return conservacao; }
    public void setConservacao(String conservacao) { this.conservacao = conservacao; }

    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
}
