package com.circulabook.config;

import org.springframework.security.oauth2.jwt.Jwt;

/** Quem está chamando a API, lido do token (nunca de parâmetros da requisição). */
public record Ator(Long id, String perfil, Long bibliotecaId) {

    public static Ator de(Jwt jwt) {
        Object bib = jwt.getClaim("bibliotecaId");
        return new Ator(
            Long.valueOf(jwt.getSubject()),
            jwt.getClaimAsString("perfil"),
            bib instanceof Number n ? n.longValue() : null);
    }
}
