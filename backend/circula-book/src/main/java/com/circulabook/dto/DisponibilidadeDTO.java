package com.circulabook.dto;

/** Linha de "Disponibilidade na rede" da Tela 3. */
public class DisponibilidadeDTO {

    private Long bibliotecaId;
    private String bibliotecaNome;
    private String endereco;
    private long totalExemplares;
    private long disponiveis;

    public DisponibilidadeDTO() {}

    public DisponibilidadeDTO(Long bibliotecaId, String bibliotecaNome, String endereco,
                              long totalExemplares, long disponiveis) {
        this.bibliotecaId = bibliotecaId;
        this.bibliotecaNome = bibliotecaNome;
        this.endereco = endereco;
        this.totalExemplares = totalExemplares;
        this.disponiveis = disponiveis;
    }

    public Long getBibliotecaId() { return bibliotecaId; }
    public void setBibliotecaId(Long bibliotecaId) { this.bibliotecaId = bibliotecaId; }

    public String getBibliotecaNome() { return bibliotecaNome; }
    public void setBibliotecaNome(String bibliotecaNome) { this.bibliotecaNome = bibliotecaNome; }

    public String getEndereco() { return endereco; }
    public void setEndereco(String endereco) { this.endereco = endereco; }

    public long getTotalExemplares() { return totalExemplares; }
    public void setTotalExemplares(long totalExemplares) { this.totalExemplares = totalExemplares; }

    public long getDisponiveis() { return disponiveis; }
    public void setDisponiveis(long disponiveis) { this.disponiveis = disponiveis; }
}
