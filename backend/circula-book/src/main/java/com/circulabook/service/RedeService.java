package com.circulabook.service;

import com.circulabook.dto.CadastroDTOs.BibliotecaRequest;
import com.circulabook.dto.CadastroDTOs.BibliotecarioRequest;
import com.circulabook.model.Biblioteca;
import com.circulabook.model.Usuario;
import com.circulabook.repository.BibliotecaRepository;
import com.circulabook.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.circulabook.service.CatalogoService.limpar;

/**
 * Cadastro da rede pelo Admin (RN18): bibliotecas e usuários BIBLIOTECARIO.
 * O Admin não cadastra usuário COMUM (esse se autocadastra no login).
 */
@Service
public class RedeService {

    public static final String BIBLIOTECARIO = "BIBLIOTECARIO";

    @Autowired private BibliotecaRepository bibliotecaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // ───────────── Bibliotecas ─────────────

    public List<Biblioteca> listarTodasBibliotecas() {
        return bibliotecaRepository.findAll();
    }

    @Transactional
    public Biblioteca criarBiblioteca(BibliotecaRequest req) {
        Biblioteca b = new Biblioteca();
        b.setAtiva(true);
        return salvarBiblioteca(b, req);
    }

    @Transactional
    public Biblioteca atualizarBiblioteca(Long id, BibliotecaRequest req) {
        return salvarBiblioteca(buscarBiblioteca(id), req);
    }

    /** Só marca a biblioteca como inativa/ativa; nenhum efeito sobre o acervo. */
    @Transactional
    public Biblioteca definirBibliotecaAtiva(Long id, boolean ativa) {
        Biblioteca b = buscarBiblioteca(id);
        b.setAtiva(ativa);
        return bibliotecaRepository.save(b);
    }

    private Biblioteca salvarBiblioteca(Biblioteca b, BibliotecaRequest req) {
        String nome = limpar(req.nome());
        if (nome == null) throw new RuntimeException("Informe o nome da biblioteca.");
        String email = limpar(req.email());
        if (email != null && !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new RuntimeException("Informe um e-mail válido para a biblioteca.");
        }
        b.setNome(nome);
        b.setEndereco(limpar(req.endereco()));
        b.setEmail(email);
        b.setTelefone(limpar(req.telefone()));
        return bibliotecaRepository.save(b);
    }

    private Biblioteca buscarBiblioteca(Long id) {
        return bibliotecaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Biblioteca não encontrada: ID " + id));
    }

    // ───────────── Bibliotecários ─────────────

    public List<Usuario> listarBibliotecarios() {
        return usuarioRepository.findByTipo(BIBLIOTECARIO);
    }

    @Transactional
    public Usuario criarBibliotecario(BibliotecarioRequest req) {
        for (String perfil : new String[] { req.tipo(), req.perfil() }) {
            if (perfil != null && !BIBLIOTECARIO.equalsIgnoreCase(perfil.trim())) {
                throw new RuntimeException("O administrador só cadastra bibliotecários. "
                    + "Usuários da comunidade se cadastram na tela de login.");
            }
        }
        String nome = limpar(req.nome());
        String email = req.email() == null ? "" : req.email().trim().toLowerCase();
        String senha = req.senha() == null ? "" : req.senha();
        if (nome == null) throw new RuntimeException("Informe o nome do bibliotecário.");
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new RuntimeException("Informe um e-mail válido.");
        }
        if (senha.length() < 6) {
            throw new RuntimeException("A senha inicial deve ter pelo menos 6 caracteres.");
        }
        if (req.bibliotecaId() == null) {
            throw new RuntimeException("Escolha a biblioteca do bibliotecário.");
        }
        Biblioteca biblioteca = buscarBiblioteca(req.bibliotecaId());
        if (!Boolean.TRUE.equals(biblioteca.getAtiva())) {
            throw new RuntimeException("A " + biblioteca.getNome() + " está inativa.");
        }
        if (usuarioRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new RuntimeException("Já existe uma conta com este e-mail.");
        }

        Usuario u = new Usuario();
        u.setNome(nome);
        u.setEmail(email);
        u.setSenhaHash(passwordEncoder.encode(senha));
        u.setTipo(BIBLIOTECARIO);
        u.setBiblioteca(biblioteca);
        u.setAtivo(true);
        return usuarioRepository.save(u);
    }

    @Transactional
    public Usuario definirBibliotecarioAtivo(Long id, boolean ativo) {
        Usuario u = usuarioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: ID " + id));
        if (!BIBLIOTECARIO.equals(u.getTipo())) {
            throw new RuntimeException("Aqui só é possível ativar ou desativar bibliotecários.");
        }
        u.setAtivo(ativo);
        return usuarioRepository.save(u);
    }
}
