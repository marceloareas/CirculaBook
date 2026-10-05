package com.circulabook.repository;

import com.circulabook.model.Biblioteca;
import com.circulabook.model.Exemplar;
import com.circulabook.model.Livro;
import com.circulabook.model.Reserva;
import com.circulabook.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    // Contagem global de um título (usada no resumo do livro)
    long countByLivroAndStatus(Livro livro, String status);

    List<Reserva> findByLivroAndUsuarioAndStatusIn(Livro livro, Usuario usuario, List<String> status);

    // Minhas reservas: as reservas ativas do usuário
    List<Reserva> findByUsuarioAndStatusIn(Usuario usuario, List<String> status);

    // Fila de espera de um título EM UMA BIBLIOTECA, em ordem de chegada
    List<Reserva> findByLivroAndBibliotecaFilaAndStatusOrderByDataReservaAsc(
        Livro livro, Biblioteca bibliotecaFila, String status);

    long countByLivroAndBibliotecaFilaAndStatus(Livro livro, Biblioteca bibliotecaFila, String status);

    // Reservas com retirada vencida
    List<Reserva> findByStatusAndDataExpiracaoBefore(String status, LocalDateTime limite);

    // Reserva ligada a um exemplar (usada ao registrar o empréstimo)
    Optional<Reserva> findFirstByExemplarAndStatus(Exemplar exemplar, String status);

}
