package com.circulabook.repository;

import com.circulabook.model.Biblioteca;
import com.circulabook.model.Exemplar;
import com.circulabook.model.Livro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExemplarRepository extends JpaRepository<Exemplar, Long> {

    List<Exemplar> findByLivro(Livro livro);

    List<Exemplar> findByBiblioteca(Biblioteca biblioteca);

    List<Exemplar> findByLivroAndBiblioteca(Livro livro, Biblioteca biblioteca);

}
