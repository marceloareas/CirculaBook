package com.circulabook.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.circulabook.repository.UsuarioRepository;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Spring Security stateless + JWT HS256.
 * As regras abaixo aplicam a matriz de autorização dos dois perfis (COMUM e
 * BIBLIOTECARIO) aos endpoints existentes. Recortes por biblioteca ficam nos controllers.
 */
@Configuration
public class SecurityConfig {

    private static final String COMUM = "COMUM";
    private static final String BIBLIOTECARIO = "BIBLIOTECARIO";

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()

                // Busca, detalhes, reserva e minhas reservas: usuário comum
                .requestMatchers(HttpMethod.GET, "/api/livros/busca", "/api/livros/*",
                                 "/api/categorias").hasRole(COMUM)
                .requestMatchers(HttpMethod.GET, "/api/reservas/posicao/*",
                                 "/api/reservas/minhas").hasRole(COMUM)
                .requestMatchers(HttpMethod.POST, "/api/reservas").hasRole(COMUM)
                .requestMatchers(HttpMethod.PATCH, "/api/reservas/*/cancelar").hasRole(COMUM)

                // Empréstimo e devolução: bibliotecário (recorte pela biblioteca no controller)
                .requestMatchers(HttpMethod.GET, "/api/exemplares/biblioteca/*",
                                 "/api/usuarios/comuns", "/api/emprestimos/ativos",
                                 "/api/emprestimos/situacao/*").hasRole(BIBLIOTECARIO)
                .requestMatchers(HttpMethod.POST, "/api/emprestimos/registrar",
                                 "/api/emprestimos/devolver").hasRole(BIBLIOTECARIO)

                // Qualquer outra rota não existe nesta versão
                .anyRequest().denyAll())
            .oauth2ResourceServer(o -> o
                .jwt(j -> j.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                .authenticationEntryPoint(naoAutenticado())
                .accessDeniedHandler(acessoNegado()))
            .exceptionHandling(e -> e
                .authenticationEntryPoint(naoAutenticado())
                .accessDeniedHandler(acessoNegado()));
        return http.build();
    }

    /** Claim "perfil" vira a role (ROLE_COMUM, ROLE_BIBLIOTECARIO). */
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter perfis = new JwtGrantedAuthoritiesConverter();
        perfis.setAuthoritiesClaimName("perfil");
        perfis.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter conv = new JwtAuthenticationConverter();
        conv.setJwtGrantedAuthoritiesConverter(perfis);
        return conv;
    }

    private AuthenticationEntryPoint naoAutenticado() {
        return (req, resp, ex) -> escrever(resp, HttpServletResponse.SC_UNAUTHORIZED,
            "Sessão inválida ou expirada. Faça login novamente.");
    }

    private AccessDeniedHandler acessoNegado() {
        return (req, resp, ex) -> escrever(resp, HttpServletResponse.SC_FORBIDDEN,
            "Acesso negado para o seu perfil.");
    }

    private static void escrever(HttpServletResponse resp, int status, String msg) throws IOException {
        resp.setStatus(status);
        resp.setContentType("text/plain;charset=UTF-8");
        resp.getWriter().write(msg);
    }

    @Bean
    public SecretKey jwtSecretKey(@Value("${circulabook.jwt.secret}") String segredo) {
        byte[] bytes = segredo.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET precisa ter pelo menos 32 caracteres.");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    /**
     * Além da assinatura e da validade, o token só vale se o usuário ainda existe na base
     * (o banco é recriado a cada boot, então tokens antigos deixam de valer).
     */
    @Bean
    public JwtDecoder jwtDecoder(SecretKey jwtSecretKey, UsuarioRepository usuarioRepository) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwtSecretKey)
            .macAlgorithm(MacAlgorithm.HS256).build();
        OAuth2TokenValidator<Jwt> usuarioExiste = jwt -> {
            boolean existe;
            try {
                existe = usuarioRepository.existsById(Long.valueOf(jwt.getSubject()));
            } catch (NumberFormatException e) {
                existe = false;
            }
            return existe
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token",
                    "Usuário inexistente.", null));
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefault(), usuarioExiste));
        return decoder;
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSecretKey));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
