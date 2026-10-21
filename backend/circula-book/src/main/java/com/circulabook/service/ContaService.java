package com.circulabook.service;

import com.circulabook.dto.ContaDTOs.*;
import com.circulabook.model.*;
import com.circulabook.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Dados do próprio usuário COMUM (Meus empréstimos).
 * Só leitura; o id vem sempre do token (o controller nunca aceita id por parâmetro).
 */
@Service
@Transactional(readOnly = true)
public class ContaService {

    private static final List<String> EMPRESTIMO_ABERTO = List.of("ATIVO", "ATRASADO");

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EmprestimoRepository emprestimoRepository;
    @Autowired private EmprestimoService emprestimoService;

    public MeusEmprestimos meusEmprestimos(Long usuarioId) {
        Usuario u = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: ID " + usuarioId));
        LocalDateTime agora = LocalDateTime.now();
        List<MeuEmprestimo> ativos = emprestimoRepository.findByUsuarioAndStatusIn(u, EMPRESTIMO_ABERTO).stream()
            .sorted(Comparator.comparing(Emprestimo::getDataPrevDevolucao))
            .map(e -> {
                long atraso = emprestimoService.calcularDiasAtraso(e.getDataPrevDevolucao(), agora);
                Livro l = e.getExemplar().getLivro();
                return new MeuEmprestimo(e.getId(), e.getExemplar().getId(), l.getId(), l.getTitulo(),
                    l.getAutor(), e.getBiblioteca().getId(), e.getBiblioteca().getNome(),
                    e.getDataEmprestimo(), e.getDataPrevDevolucao(),
                    atraso, e.getDataPrevDevolucao().isBefore(agora));
            })
            .toList();
        boolean bloqueado = u.getBloqueadoAte() != null && u.getBloqueadoAte().isAfter(agora);
        return new MeusEmprestimos(ativos, ativos.size(), EmprestimoService.LIMITE_EMPRESTIMOS,
            bloqueado, bloqueado ? u.getBloqueadoAte() : null);
    }
}
