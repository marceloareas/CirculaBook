package com.circulabook.service;

import com.circulabook.model.Biblioteca;
import com.circulabook.model.Exemplar;
import com.circulabook.model.Livro;
import com.circulabook.model.StatusExemplar;
import com.circulabook.repository.ExemplarRepository;
import com.circulabook.repository.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Máquina de estados do exemplar.
 *
 * É o ÚNICO lugar que altera {@code exemplar.status}: os demais especialistas
 * pedem a mudança aqui, que recusa qualquer transição fora da tabela de StatusExemplar.
 * Também mantém a invariante da fila por meio de sincronizarMarcaDeFila.
 */
@Service
public class EstadoExemplarService {

    @Autowired private ExemplarRepository exemplarRepository;
    @Autowired private ReservaRepository reservaRepository;

    /** Muda o status do exemplar validando a transição. */
    @Transactional
    public Exemplar mudarStatus(Exemplar exemplar, String novoStatus) {
        String atual = exemplar.getStatus();
        if (!StatusExemplar.transicaoValida(atual, novoStatus)) {
            throw new RuntimeException("Mudança de situação não permitida para o Exemplar nº "
                + exemplar.getId() + ": de " + StatusExemplar.rotulo(atual)
                + " para " + StatusExemplar.rotulo(novoStatus) + ".");
        }
        exemplar.setStatus(novoStatus);
        return exemplarRepository.save(exemplar);
    }

    /** Há reservas PENDENTE do título na fila desta biblioteca? */
    public boolean temFila(Livro livro, Biblioteca biblioteca) {
        return reservaRepository.countByLivroAndBibliotecaFilaAndStatus(livro, biblioteca, "PENDENTE") > 0;
    }

    /**
     * Invariante da fila: com fila PENDENTE, todo exemplar emprestado do título
     * nesta biblioteca fica EMPRESTADO_RESERVADO; sem fila, EMPRESTADO.
     * Chamar ao final de toda operação que mexe em fila ou empréstimo.
     */
    @Transactional
    public void sincronizarMarcaDeFila(Livro livro, Biblioteca biblioteca) {
        if (livro == null || biblioteca == null) return;
        String alvo = temFila(livro, biblioteca)
            ? StatusExemplar.EMPRESTADO_RESERVADO
            : StatusExemplar.EMPRESTADO;
        for (Exemplar e : exemplarRepository.findByLivroAndBiblioteca(livro, biblioteca)) {
            if (StatusExemplar.emprestado(e.getStatus()) && !alvo.equals(e.getStatus())) {
                mudarStatus(e, alvo);
            }
        }
    }
}
