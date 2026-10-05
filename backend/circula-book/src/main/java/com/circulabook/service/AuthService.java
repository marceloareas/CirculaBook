package com.circulabook.service;

import com.circulabook.dto.AuthDTOs.AuthResponse;
import com.circulabook.dto.AuthDTOs.LoginRequest;
import com.circulabook.dto.AuthDTOs.UsuarioSessao;
import com.circulabook.model.Usuario;
import com.circulabook.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/** Login e emissão do JWT (usuários já cadastrados na base). */
@Service
public class AuthService {

    private static final String CREDENCIAL_INVALIDA = "E-mail ou senha inválidos";

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtEncoder jwtEncoder;

    @Value("${circulabook.jwt.expiracao-horas:8}")
    private long expiracaoHoras;

    /** Erro de autenticação com o status HTTP que o controller deve devolver. */
    public static class AuthException extends RuntimeException {
        private final HttpStatus status;
        public AuthException(HttpStatus status, String mensagem) {
            super(mensagem);
            this.status = status;
        }
        public HttpStatus getStatus() { return status; }
    }

    public AuthResponse login(LoginRequest req) {
        String email = normalizar(req.email());
        Usuario u = email.isEmpty() ? null : usuarioRepository.findByEmailIgnoreCase(email).orElse(null);

        // Mesma mensagem para e-mail inexistente e senha errada
        if (u == null || req.senha() == null || !passwordEncoder.matches(req.senha(), u.getSenhaHash())) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, CREDENCIAL_INVALIDA);
        }
        return emitir(u);
    }

    public UsuarioSessao me(Long usuarioId) {
        return usuarioRepository.findById(usuarioId)
            .map(UsuarioSessao::de)
            .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED,
                "Sessão inválida ou expirada. Faça login novamente."));
    }

    private AuthResponse emitir(Usuario u) {
        Instant agora = Instant.now();
        Instant expiraEm = agora.plus(expiracaoHoras, ChronoUnit.HOURS);

        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
            .issuer("circula-book")
            .subject(String.valueOf(u.getId()))
            .issuedAt(agora)
            .expiresAt(expiraEm)
            .claim("perfil", u.getTipo());
        if (u.getBiblioteca() != null) {
            claims.claim("bibliotecaId", u.getBiblioteca().getId());
        }

        String token = jwtEncoder.encode(JwtEncoderParameters.from(
            JwsHeader.with(MacAlgorithm.HS256).build(), claims.build())).getTokenValue();
        return new AuthResponse(token, expiraEm, UsuarioSessao.de(u));
    }

    private static String normalizar(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
