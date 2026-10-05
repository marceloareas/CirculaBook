package com.circulabook.controller;

import com.circulabook.model.Categoria;
import com.circulabook.repository.CategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    @Autowired
    private CategoriaRepository categoriaRepository;

    /** Tela de Busca — atalhos e filtro por categoria. */
    @GetMapping
    public List<Categoria> obterTodas() {
        return categoriaRepository.findAll(Sort.by("nome"));
    }
}
