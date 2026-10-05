package com.circulabook.dto;

import com.circulabook.model.Usuario;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;

/** Payloads de /api/auth (login, me). */
public final class AuthDTOs {

    private AuthDTOs() {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LoginRequest(String email, String senha) {}

    public record UsuarioSessao(Long id, String nome, String email, String perfil,
                                Long bibliotecaId, String bibliotecaNome) {
        public static UsuarioSessao de(Usuario u) {
            return new UsuarioSessao(u.getId(), u.getNome(), u.getEmail(), u.getTipo(),
                u.getBiblioteca() != null ? u.getBiblioteca().getId() : null,
                u.getBiblioteca() != null ? u.getBiblioteca().getNome() : null);
        }
    }

    public record AuthResponse(String token, Instant expiraEm, UsuarioSessao usuario) {}
}
