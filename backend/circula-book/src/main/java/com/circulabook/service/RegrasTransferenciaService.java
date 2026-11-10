package com.circulabook.service;

import com.circulabook.model.Biblioteca;
import com.circulabook.model.Livro;
import com.circulabook.model.SolicitacaoTransferencia;
import com.circulabook.repository.ExemplarRepository;
import com.circulabook.repository.SolicitacaoTransferenciaRepository;
import com.circulabook.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Regras que decidem se uma transferência pode existir (§5.3 e RN22).
 * Fica separado do TransferenciaService para que o FilaEsperaService (que despacha
 * na devolução) também possa consultá-las sem dependência circular.
 */
@Service
public class RegrasTransferenciaService {

    /** Status que contam como "abertas" na RN15. */
    public static final List<String> TRANSFERENCIA_ABERTA = List.of("PENDENTE", "APROVADA", "EM_TRANSITO");

    @Autowired private ExemplarRepository exemplarRepository;
    @Autowired private SolicitacaoTransferenciaRepository transferenciaRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    /**
     * Situação da RN15 para o par (origem, título).
     * {@code total} = exemplares do título na origem (qualquer status);
     * {@code abertas} = transferências do título saindo dela em PENDENTE/APROVADA/EM_TRANSITO;
     * {@code cabem} = quantas transferências NOVAS ainda são aceitas ({@code total - 1 - abertas}).
     */
    public record Capacidade(long total, long abertas, long cabem) {
        public boolean permite(long novas) { return novas <= cabem; }
    }

    /**
     * @param ignorar pedido já existente que está sendo reavaliado (aprovação/despacho):
     *                não conta como "aberta" contra si mesmo.
     */
    public Capacidade capacidade(Livro livro, Biblioteca origem, SolicitacaoTransferencia ignorar) {
        long total = exemplarRepository.countByLivroAndBiblioteca(livro, origem);
        long abertas = transferenciaRepository.countByLivroAndBibliotecaOrigemAndStatusIn(
            livro, origem, TRANSFERENCIA_ABERTA);
        if (ignorar != null && TRANSFERENCIA_ABERTA.contains(ignorar.getStatus())
                && ignorar.getLivro().getId().equals(livro.getId())
                && ignorar.getBibliotecaOrigem().getId().equals(origem.getId())) {
            abertas--;
        }
        return new Capacidade(total, abertas, total - 1 - abertas);
    }

    /** RN15 para uma transferência nova (criação de reserva com retirada em outra biblioteca). */
    public String motivoBloqueioOrigem(Livro livro, Biblioteca origem) {
        return motivoBloqueioOrigem(livro, origem, null);
    }

    /**
     * RN15 (§5.3): mais uma transferência só cabe se {@code abertas + 1 <= total - 1}.
     * Devolve o motivo do bloqueio, ou null se pode.
     */
    public String motivoBloqueioOrigem(Livro livro, Biblioteca origem, SolicitacaoTransferencia ignorar) {
        Capacidade c = capacidade(livro, origem, ignorar);
        if (c.permite(1)) return null;
        if (c.total() <= 1) {
            return "A " + origem.getNome() + " tem só 1 exemplar deste título, e ele não pode sair de lá: "
                + "nenhuma biblioteca pode ficar sem o livro.";
        }
        return "A " + origem.getNome() + " já tem " + c.abertas() + " transferência(s) deste título em andamento; "
            + "mais uma a deixaria sem o livro.";
    }

    /** RN22: o destino precisa estar ativo e ter ao menos um bibliotecário ativo para receber. */
    public String motivoBloqueioDestino(Biblioteca destino) {
        if (Boolean.FALSE.equals(destino.getAtiva())) {
            return "A " + destino.getNome() + " está inativa.";
        }
        if (!usuarioRepository.existsByTipoAndBibliotecaAndAtivoTrue("BIBLIOTECARIO", destino)) {
            return "A " + destino.getNome() + " ainda não tem bibliotecário ativo para receber o livro.";
        }
        return null;
    }
}
