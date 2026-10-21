package com.circulabook.controller;

import com.circulabook.config.Ator;
import com.circulabook.dto.CadastroExemplarDTO;
import com.circulabook.repository.BibliotecaRepository;
import com.circulabook.repository.ExemplarRepository;
import com.circulabook.service.ExemplarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.Objects;

@RestController
@RequestMapping("/api/exemplares")
public class ExemplarController {

    @Autowired
    private ExemplarRepository exemplarRepository;

    @Autowired
    private BibliotecaRepository bibliotecaRepository;

    @Autowired
    private ExemplarService exemplarService;

    /** Tela de Empréstimo — acervo da biblioteca do bibliotecário logado. */
    @GetMapping("/biblioteca/{bibliotecaId}")
    public ResponseEntity<?> obterPorBiblioteca(@PathVariable Long bibliotecaId,
                                                @AuthenticationPrincipal Jwt jwt) {
        if (!Objects.equals(bibliotecaId, Ator.de(jwt).bibliotecaId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Só é possível consultar o acervo da sua biblioteca.");
        }
        return bibliotecaRepository.findById(bibliotecaId)
            .<ResponseEntity<?>>map(b -> ResponseEntity.ok(exemplarRepository.findByBiblioteca(b)))
            .orElseGet(() -> ResponseEntity.badRequest().body("Biblioteca não encontrada: ID " + bibliotecaId));
    }

    /**
     * B4 — cadastrar exemplares de livro existente na biblioteca do bibliotecário logado.
     * Corpo: {livroId, conservacao (NOVO|BOM|USADO), quantidade (pelo menos 1)}; devolve a lista criada.
     * Informar bibliotecaId de outra biblioteca -> 403.
     */
    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody CadastroExemplarDTO dto,
                                       @AuthenticationPrincipal Jwt jwt) {
        Ator ator = Ator.de(jwt);
        if (dto.getBibliotecaId() != null && !Objects.equals(dto.getBibliotecaId(), ator.bibliotecaId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Só é possível cadastrar exemplares na sua biblioteca.");
        }
        try {
            return ResponseEntity.ok(exemplarService.cadastrar(dto, ator.id()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
