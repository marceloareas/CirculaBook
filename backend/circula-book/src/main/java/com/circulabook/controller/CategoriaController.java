package com.circulabook.controller;

import com.circulabook.dto.CadastroDTOs.CategoriaRequest;
import com.circulabook.model.Categoria;
import com.circulabook.repository.CategoriaRepository;
import com.circulabook.service.CatalogoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private CatalogoService catalogoService;

    @GetMapping
    public List<Categoria> obterTodas() {
        return categoriaRepository.findAll(Sort.by("nome"));
    }

    /** A7 — criar categoria (só ADMIN). */
    @PostMapping
    public ResponseEntity<?> criar(@RequestBody CategoriaRequest req) {
        try {
            return ResponseEntity.ok(catalogoService.criarCategoria(req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** A7 — editar categoria (só ADMIN). */
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody CategoriaRequest req) {
        try {
            return ResponseEntity.ok(catalogoService.atualizarCategoria(id, req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
