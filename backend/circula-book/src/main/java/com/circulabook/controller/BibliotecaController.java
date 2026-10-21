package com.circulabook.controller;

import com.circulabook.dto.CadastroDTOs.BibliotecaRequest;
import com.circulabook.model.Biblioteca;
import com.circulabook.repository.BibliotecaRepository;
import com.circulabook.service.RedeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/bibliotecas")
public class BibliotecaController {

    @Autowired
    private BibliotecaRepository bibliotecaRepository;

    @Autowired
    private RedeService redeService;

    /** Bibliotecas ativas (formulário de cadastro de bibliotecário; só ADMIN). */
    @GetMapping
    public List<Biblioteca> obterTodas() {
        return bibliotecaRepository.findByAtivaTrue();
    }

    /** A5 — todas, inclusive as inativas (só ADMIN). */
    @GetMapping("/todas")
    public List<Biblioteca> obterTodasInclusiveInativas() {
        return redeService.listarTodasBibliotecas();
    }

    /** A5 — criar (só ADMIN). */
    @PostMapping
    public ResponseEntity<?> criar(@RequestBody BibliotecaRequest req) {
        return responder(() -> redeService.criarBiblioteca(req));
    }

    /** A5 — editar (só ADMIN). */
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody BibliotecaRequest req) {
        return responder(() -> redeService.atualizarBiblioteca(id, req));
    }

    /** A5 — desativar: só marca como inativa (só ADMIN). */
    @PatchMapping("/{id}/desativar")
    public ResponseEntity<?> desativar(@PathVariable Long id) {
        return responder(() -> redeService.definirBibliotecaAtiva(id, false));
    }

    /** A5 — reativar (só ADMIN). */
    @PatchMapping("/{id}/ativar")
    public ResponseEntity<?> ativar(@PathVariable Long id) {
        return responder(() -> redeService.definirBibliotecaAtiva(id, true));
    }

    private ResponseEntity<?> responder(Supplier<?> acao) {
        try {
            return ResponseEntity.ok(acao.get());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
