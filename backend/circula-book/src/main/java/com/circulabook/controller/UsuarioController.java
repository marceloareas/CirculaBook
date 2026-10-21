package com.circulabook.controller;

import com.circulabook.dto.CadastroDTOs.BibliotecarioRequest;
import com.circulabook.model.Usuario;
import com.circulabook.repository.UsuarioRepository;
import com.circulabook.service.RedeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RedeService redeService;

    /** Tela de Empréstimo — usuários da comunidade, para o bibliotecário localizar o leitor. */
    @GetMapping("/comuns")
    public List<Usuario> listarComuns() {
        return usuarioRepository.findByTipo("COMUM");
    }

    /** A6 — bibliotecários da rede (só ADMIN). */
    @GetMapping("/bibliotecarios")
    public List<Usuario> listarBibliotecarios() {
        return redeService.listarBibliotecarios();
    }

    /** A6 — cadastrar bibliotecário com biblioteca obrigatória e senha inicial (só ADMIN). */
    @PostMapping("/bibliotecarios")
    public ResponseEntity<?> criarBibliotecario(@RequestBody BibliotecarioRequest req) {
        return responder(() -> redeService.criarBibliotecario(req));
    }

    @PatchMapping("/bibliotecarios/{id}/desativar")
    public ResponseEntity<?> desativarBibliotecario(@PathVariable Long id) {
        return responder(() -> redeService.definirBibliotecarioAtivo(id, false));
    }

    @PatchMapping("/bibliotecarios/{id}/ativar")
    public ResponseEntity<?> ativarBibliotecario(@PathVariable Long id) {
        return responder(() -> redeService.definirBibliotecarioAtivo(id, true));
    }

    private ResponseEntity<?> responder(Supplier<?> acao) {
        try {
            return ResponseEntity.ok(acao.get());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
