package com.circulabook.service;

import com.circulabook.dto.DisponibilidadeDTO;
import com.circulabook.dto.LivroResumoDTO;
import com.circulabook.model.Exemplar;
import com.circulabook.model.Livro;
import com.circulabook.repository.ExemplarRepository;
import com.circulabook.repository.LivroRepository;
import com.circulabook.repository.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Busca de livros na rede (RN09 / UC01 / UC02).
 */
@Service
public class LivroService {

    public static final String DISPONIVEL = "DISPONIVEL";

    @Autowired
    private LivroRepository livroRepository;

    @Autowired
    private ExemplarRepository exemplarRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    /** Busca na rede com filtros opcionais (Tela 1 -> Tela 2). */
    public List<LivroResumoDTO> buscar(String termo, String autor, String isbn,
                                       Long categoriaId, Integer anoDe, Integer anoAte) {
        // Converte "filtro não informado" em valor-sentinela.
        // Nunca passamos null para a query — ver comentário no LivroRepository.
        List<Livro> livros = livroRepository.buscar(
            texto(termo),
            texto(autor),
            texto(isbn),
            numeroLongo(categoriaId),
            numeroInteiro(anoDe),
            numeroInteiro(anoAte));

        List<LivroResumoDTO> resultado = new ArrayList<>();
        for (Livro livro : livros) {
            resultado.add(montarResumo(livro, false));
        }
        return resultado;
    }

    /** Detalhe de um título, já com a lista de bibliotecas (Tela 3). */
    public LivroResumoDTO obterDetalhe(Long livroId) {
        Livro livro = livroRepository.findById(livroId)
            .orElseThrow(() -> new RuntimeException("Livro não encontrado: ID " + livroId));
        return montarResumo(livro, true);
    }

    private LivroResumoDTO montarResumo(Livro livro, boolean incluirDisponibilidade) {
        List<Exemplar> exemplares = exemplarRepository.findByLivro(livro);

        long disponiveis = exemplares.stream()
            .filter(e -> DISPONIVEL.equals(e.getStatus()))
            .count();

        // Agrupa por biblioteca preservando a ordem de aparição
        Map<Long, DisponibilidadeDTO> porBiblioteca = new LinkedHashMap<>();
        for (Exemplar e : exemplares) {
            Long bibId = e.getBiblioteca().getId();
            DisponibilidadeDTO d = porBiblioteca.get(bibId);
            if (d == null) {
                d = new DisponibilidadeDTO(bibId, e.getBiblioteca().getNome(),
                                           e.getBiblioteca().getEndereco(), 0, 0);
                porBiblioteca.put(bibId, d);
            }
            d.setTotalExemplares(d.getTotalExemplares() + 1);
            if (DISPONIVEL.equals(e.getStatus())) {
                d.setDisponiveis(d.getDisponiveis() + 1);
            }
        }

        long bibliotecasComDisponivel = porBiblioteca.values().stream()
            .filter(d -> d.getDisponiveis() > 0)
            .count();

        long fila = reservaRepository.countByLivroAndStatus(livro, "PENDENTE");

        LivroResumoDTO dto = new LivroResumoDTO();
        dto.setId(livro.getId());
        dto.setTitulo(livro.getTitulo());
        dto.setAutor(livro.getAutor());
        dto.setEditora(livro.getEditora());
        dto.setIsbn(livro.getIsbn());
        dto.setAnoPublicacao(livro.getAnoPublicacao());
        dto.setCategoria(livro.getCategoria() != null ? livro.getCategoria().getNome() : null);
        dto.setSinopse(livro.getSinopse());
        dto.setTotalExemplares(exemplares.size());
        dto.setDisponiveis(disponiveis);
        dto.setBibliotecasComDisponivel(bibliotecasComDisponivel);
        dto.setNaFilaDeEspera(fila);
        dto.setSituacao(calcularSituacao(exemplares.size(), disponiveis));

        if (incluirDisponibilidade) {
            dto.setDisponibilidade(new ArrayList<>(porBiblioteca.values()));
        }
        return dto;
    }

    /**
     * Três estados exibidos no badge da tela de resultados:
     *  - DISPONIVEL   : há pelo menos um exemplar livre
     *  - AGUARDANDO   : existem exemplares, mas todos emprestados/reservados
     *  - INDISPONIVEL : nenhum exemplar cadastrado na rede
     */
    private String calcularSituacao(long total, long disponiveis) {
        if (total == 0) return "INDISPONIVEL";
        if (disponiveis > 0) return "DISPONIVEL";
        return "AGUARDANDO";
    }

    // ─── Sentinelas: substituem o null que quebrava a query no PostgreSQL ───

    private String texto(String s) {
        return (s == null || s.isBlank()) ? "" : s.trim();
    }

    private Long numeroLongo(Long v) {
        return (v == null || v <= 0) ? 0L : v;
    }

    private Integer numeroInteiro(Integer v) {
        return (v == null || v <= 0) ? 0 : v;
    }
}