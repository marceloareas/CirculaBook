package com.circulabook.dto;

import java.time.LocalDateTime;
import java.util.List;

/** Respostas de /api/conta (dados do próprio usuário COMUM). */
public final class ContaDTOs {

    private ContaDTOs() {}

    public record MeuEmprestimo(
        Long id, Long exemplarId, Long livroId, String titulo, String autor,
        Long bibliotecaId, String biblioteca,
        LocalDateTime dataEmprestimo, LocalDateTime dataPrevDevolucao,
        long diasAtraso, boolean atrasado) {}

    /** GET /api/conta/emprestimos: ativos + total x/limite + bloqueio por atraso. */
    public record MeusEmprestimos(
        List<MeuEmprestimo> emprestimos, int total, int limite,
        boolean bloqueado, LocalDateTime bloqueadoAte) {}

    /** Página de uma listagem paginada no servidor (pagina começa em 0). */
    public record Pagina<T>(List<T> itens, int pagina, int tamanho, long totalItens, int totalPaginas) {}
}
