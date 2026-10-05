package com.circulabook.controller;

import com.circulabook.config.Ator;
import com.circulabook.dto.ReservaRequestDTO;
import com.circulabook.repository.ReservaRepository;
import com.circulabook.service.ReservaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    @Autowired
    private ReservaService reservaService;

    @Autowired
    private ReservaRepository reservaRepository;

    /** Tela de reserva — "você ocupará a posição N na fila" da biblioteca. */
    @GetMapping("/posicao/{livroId}")
    public ResponseEntity<?> posicaoNaFila(@PathVariable Long livroId, @RequestParam Long bibliotecaId) {
        try {
            return ResponseEntity.ok(Map.of("posicao", reservaService.posicaoNaFila(livroId, bibliotecaId)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** UC03 — Entrar na fila. O usuário é sempre o do token. */
    @PostMapping
    public ResponseEntity<?> criar(@RequestBody ReservaRequestDTO req,
                                   @AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(reservaService.criar(
                req.getLivroId(), Ator.de(jwt).id(), req.getBibliotecaId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Minhas Reservas — reservas ativas do usuário do token. */
    @GetMapping("/minhas")
    public ResponseEntity<?> minhas(@AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(reservaService.minhasReservas(Ator.de(jwt).id()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** UC07 — Cancelar reserva. Só o dono da reserva pode cancelar. */
    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        Long atorId = Ator.de(jwt).id();
        boolean outroDono = reservaRepository.findById(id)
            .map(r -> !atorId.equals(r.getUsuario().getId()))
            .orElse(false); // reserva inexistente: o service devolve a mensagem adequada
        if (outroDono) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Você só pode cancelar as suas reservas.");
        }
        try {
            return ResponseEntity.ok(reservaService.cancelar(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
