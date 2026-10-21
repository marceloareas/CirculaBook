package com.circulabook.controller;

import com.circulabook.config.Ator;
import com.circulabook.service.ContaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * Dados do próprio usuário COMUM. Não há id na URL nem em parâmetros:
 * o usuário é sempre o do token (RN08).
 */
@RestController
@RequestMapping("/api/conta")
public class ContaController {

    @Autowired
    private ContaService contaService;

    /** Empréstimos em aberto, total x/3 e bloqueio por atraso (RN12). */
    @GetMapping("/emprestimos")
    public ResponseEntity<?> emprestimos(@AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(contaService.meusEmprestimos(Ator.de(jwt).id()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
