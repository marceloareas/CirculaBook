package com.circulabook.controller;

import com.circulabook.dto.LivroResumoDTO;
import com.circulabook.service.LivroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/livros")
public class LivroController {

    @Autowired
    private LivroService livroService;

    /** Telas 1 e 2 — busca na rede com filtros opcionais (RN09). */
    @GetMapping("/busca")
    public ResponseEntity<?> buscar(
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) String autor,
            @RequestParam(required = false) String isbn,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) Integer anoDe,
            @RequestParam(required = false) Integer anoAte) {
        try {
            List<LivroResumoDTO> r = livroService.buscar(termo, autor, isbn, categoriaId, anoDe, anoAte);
            return ResponseEntity.ok(r);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Tela 3 — detalhe do título com disponibilidade por biblioteca. */
    @GetMapping("/{id}")
    public ResponseEntity<?> obterDetalhe(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(livroService.obterDetalhe(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
