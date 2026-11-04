package com.circulabook.repository;

import com.circulabook.model.Reserva;
import com.circulabook.model.SolicitacaoTransferencia;
import com.circulabook.model.Livro;
import com.circulabook.model.Biblioteca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitacaoTransferenciaRepository extends JpaRepository<SolicitacaoTransferencia, Long> {

    List<SolicitacaoTransferencia> findByStatusOrderByDataSolicitacaoAsc(String status);

    // Pedidos de transferência ligados a uma reserva
    Optional<SolicitacaoTransferencia> findFirstByReservaAndStatusIn(Reserva reserva, List<String> status);

    List<SolicitacaoTransferencia> findByReservaAndStatusIn(Reserva reserva, List<String> status);

    long countByStatus(String status);

    // RN15: transferências abertas do título saindo de uma biblioteca
    long countByLivroAndBibliotecaOrigemAndStatusIn(Livro livro, Biblioteca bibliotecaOrigem, List<String> status);

    // Pedido mais recente de uma reserva (situação mostrada em "Minhas reservas")
    Optional<SolicitacaoTransferencia> findFirstByReservaOrderByDataSolicitacaoDescIdDesc(Reserva reserva);
}
