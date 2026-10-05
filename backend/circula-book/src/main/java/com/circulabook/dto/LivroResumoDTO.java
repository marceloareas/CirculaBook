package com.circulabook.dto;

import java.util.List;

/**
 * Card de resultado da busca (Tela 2) e cabeçalho da Tela 3.
 * "situacao" alimenta o badge colorido: DISPONIVEL | AGUARDANDO | INDISPONIVEL.
 */
public class LivroResumoDTO {

    private Long id;
    private String titulo;
    private String autor;
    private String editora;
    private String isbn;
    private Integer anoPublicacao;
    private String categoria;
    private String sinopse;

    private long totalExemplares;
    private long disponiveis;
    private long bibliotecasComDisponivel;
    private long naFilaDeEspera;
    private String situacao;

    private List<DisponibilidadeDTO> disponibilidade;

    public LivroResumoDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getAutor() { return autor; }
    public void setAutor(String autor) { this.autor = autor; }

    public String getEditora() { return editora; }
    public void setEditora(String editora) { this.editora = editora; }

    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }

    public Integer getAnoPublicacao() { return anoPublicacao; }
    public void setAnoPublicacao(Integer anoPublicacao) { this.anoPublicacao = anoPublicacao; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getSinopse() { return sinopse; }
    public void setSinopse(String sinopse) { this.sinopse = sinopse; }

    public long getTotalExemplares() { return totalExemplares; }
    public void setTotalExemplares(long totalExemplares) { this.totalExemplares = totalExemplares; }

    public long getDisponiveis() { return disponiveis; }
    public void setDisponiveis(long disponiveis) { this.disponiveis = disponiveis; }

    public long getBibliotecasComDisponivel() { return bibliotecasComDisponivel; }
    public void setBibliotecasComDisponivel(long v) { this.bibliotecasComDisponivel = v; }

    public long getNaFilaDeEspera() { return naFilaDeEspera; }
    public void setNaFilaDeEspera(long naFilaDeEspera) { this.naFilaDeEspera = naFilaDeEspera; }

    public String getSituacao() { return situacao; }
    public void setSituacao(String situacao) { this.situacao = situacao; }

    public List<DisponibilidadeDTO> getDisponibilidade() { return disponibilidade; }
    public void setDisponibilidade(List<DisponibilidadeDTO> d) { this.disponibilidade = d; }
}
