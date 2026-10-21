package com.circulabook.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Corpos dos cadastros do Admin (catálogo, bibliotecas e bibliotecários). */
public final class CadastroDTOs {

    private CadastroDTOs() {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LivroRequest(String titulo, String autor, String isbn, String editora,
                               Integer anoPublicacao, Long categoriaId, String sinopse) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CategoriaRequest(String nome, String descricao) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record BibliotecaRequest(String nome, String endereco, String email, String telefone) {}

    /**
     * Cadastro de bibliotecário pelo Admin. "tipo"/"perfil" só são lidos para
     * recusar qualquer tentativa de criar outro perfil (o Admin não cria COMUM).
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record BibliotecarioRequest(String nome, String email, String senha, Long bibliotecaId,
                                       String tipo, String perfil) {}
}
