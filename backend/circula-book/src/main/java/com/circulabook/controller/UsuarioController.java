package com.circulabook.controller;

import com.circulabook.model.Usuario;
import com.circulabook.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    /** Tela de Empréstimo — usuários da comunidade, para o bibliotecário localizar o leitor. */
    @GetMapping("/comuns")
    public List<Usuario> listarComuns() {
        return usuarioRepository.findByTipo("COMUM");
    }
}
