package com.circulabook.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.circulabook.dto.CadastroExemplarDTO;
import com.circulabook.model.*;
import com.circulabook.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Exemplares: entrada no acervo (RN10).
 */
@Service
public class ExemplarService {

    private static final Logger log = LoggerFactory.getLogger(ExemplarService.class);

    private static final Set<String> CONSERVACOES_NO_CADASTRO = Set.of("NOVO", "BOM", "USADO");

    @Autowired private LivroRepository livroRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private FilaEsperaService filaEsperaService;

    /**
     * B4 — entrada de exemplares no acervo (RN10).
     * Só o bibliotecário cadastra, sempre na própria biblioteca, e apenas de livro
     * já cadastrado pelo Admin. Cria {@code quantidade} exemplares (pelo menos 1).
     * T15: cada um nasce DISPONIVEL ou, se a biblioteca tem fila do título,
     * RESERVADO atendendo o próximo da fila.
     */
    @Transactional
    public List<Exemplar> cadastrar(CadastroExemplarDTO dto, Long bibliotecarioId) {

        Usuario bibliotecario = usuarioRepository.findById(bibliotecarioId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: ID " + bibliotecarioId));
        if (!"BIBLIOTECARIO".equals(bibliotecario.getTipo()) || bibliotecario.getBiblioteca() == null) {
            throw new RuntimeException("Apenas bibliotecários cadastram exemplares, na própria biblioteca.");
        }
        Biblioteca biblioteca = bibliotecario.getBiblioteca();
        if (dto.getBibliotecaId() != null && !dto.getBibliotecaId().equals(biblioteca.getId())) {
            throw new RuntimeException("Só é possível cadastrar exemplares na sua biblioteca.");
        }

        if (dto.getLivroId() == null) {
            throw new RuntimeException("Escolha um livro já cadastrado no catálogo.");
        }
        Livro livro = livroRepository.findById(dto.getLivroId())
            .orElseThrow(() -> new RuntimeException("Livro não encontrado: ID " + dto.getLivroId()));

        int quantidade = dto.getQuantidade() != null ? dto.getQuantidade() : 1;
        if (quantidade < 1) {
            throw new RuntimeException("A quantidade deve ser de pelo menos 1 exemplar.");
        }
        String conservacao = dto.getConservacao() != null ? dto.getConservacao().trim().toUpperCase() : "NOVO";
        if (!CONSERVACOES_NO_CADASTRO.contains(conservacao)) {
            throw new RuntimeException("A conservação deve ser Novo, Bom ou Usado.");
        }

        List<Exemplar> criados = new ArrayList<>();
        for (int i = 0; i < quantidade; i++) {
            Exemplar exemplar = new Exemplar();
            exemplar.setLivro(livro);
            exemplar.setBiblioteca(biblioteca);
            exemplar.setEstadoConservacao(conservacao);

            // T15: a fila define o status inicial (o exemplar é salvo pela máquina de estados)
            filaEsperaService.liberar(exemplar);
            criados.add(exemplar);
        }

        log.info("[CIRCULA BOOK] " + quantidade + " exemplar(es) de " + livro.getTitulo()
            + " cadastrado(s) na " + biblioteca.getNome() + ".");
        return criados;
    }
}
