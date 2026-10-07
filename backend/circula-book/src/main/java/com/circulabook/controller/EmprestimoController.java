package com.circulabook.controller;

import com.circulabook.config.Ator;
import com.circulabook.dto.DevolucaoRequestDTO;
import com.circulabook.dto.EmprestimoRequestDTO;
import com.circulabook.model.Emprestimo;
import com.circulabook.repository.EmprestimoRepository;
import com.circulabook.repository.ExemplarRepository;
import com.circulabook.service.EmprestimoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/emprestimos")
public class EmprestimoController {

    @Autowired
    private EmprestimoService emprestimoService;

    @Autowired
    private ExemplarRepository exemplarRepository;

    @Autowired
    private EmprestimoRepository emprestimoRepository;

    /** Tela de Devolução — empréstimos em aberto da biblioteca do bibliotecário. */
    @GetMapping("/ativos")
    public List<Emprestimo> obterAtivos(@AuthenticationPrincipal Jwt jwt) {
        return recortar(Ator.de(jwt), emprestimoService.obterAtivos());
    }

    /** Tela de Empréstimo — painel de alertas: o usuário está apto? (RN01/RN12) */
    @GetMapping("/situacao/{usuarioId}")
    public ResponseEntity<?> consultarSituacao(@PathVariable Long usuarioId) {
        try {
            return ResponseEntity.ok(emprestimoService.consultarSituacao(usuarioId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Tela de Empréstimo — UC09 Registrar empréstimo. O usuarioId do corpo é o tomador. */
    @PostMapping("/registrar")
    public ResponseEntity<?> registrar(@RequestBody EmprestimoRequestDTO req,
                                       @AuthenticationPrincipal Jwt jwt) {
        Ator ator = Ator.de(jwt);
        boolean daCasa = req.getExemplarId() != null && exemplarRepository.findById(req.getExemplarId())
            .map(ex -> ex.getBiblioteca() != null
                && Objects.equals(ex.getBiblioteca().getId(), ator.bibliotecaId()))
            .orElse(true); // exemplar inexistente: o service devolve a mensagem adequada
        if (!daCasa) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Só é possível registrar empréstimos de exemplares da sua biblioteca.");
        }
        try {
            return ResponseEntity.ok(emprestimoService.registrar(
                req.getExemplarId(), req.getUsuarioId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Tela de Devolução — UC10 Registrar devolução. */
    @PostMapping("/devolver")
    public ResponseEntity<?> devolver(@RequestBody DevolucaoRequestDTO req,
                                      @AuthenticationPrincipal Jwt jwt) {
        Ator ator = Ator.de(jwt);
        boolean daCasa = req.getEmprestimoId() != null && emprestimoRepository.findById(req.getEmprestimoId())
            .map(emp -> emp.getBiblioteca() != null
                && Objects.equals(emp.getBiblioteca().getId(), ator.bibliotecaId()))
            .orElse(true);
        if (!daCasa) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Só é possível registrar devoluções de empréstimos da sua biblioteca.");
        }
        try {
            return ResponseEntity.ok(emprestimoService.devolver(req.getEmprestimoId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Bibliotecário só enxerga empréstimos da própria biblioteca. */
    private List<Emprestimo> recortar(Ator ator, List<Emprestimo> lista) {
        return lista.stream()
            .filter(e -> e.getBiblioteca() != null
                && Objects.equals(e.getBiblioteca().getId(), ator.bibliotecaId()))
            .toList();
    }
}
