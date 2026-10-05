package com.circulabook.controller;

import com.circulabook.dto.AuthDTOs.LoginRequest;
import com.circulabook.service.AuthService;
import com.circulabook.service.AuthService.AuthException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        return responder(() -> authService.login(req));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal Jwt jwt) {
        return responder(() -> authService.me(Long.valueOf(jwt.getSubject())));
    }

    private ResponseEntity<?> responder(Supplier<?> acao) {
        try {
            return ResponseEntity.ok(acao.get());
        } catch (AuthException e) {
            return ResponseEntity.status(e.getStatus()).body(e.getMessage());
        }
    }
}
