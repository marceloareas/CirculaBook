package com.circulabook.repository;

import com.circulabook.model.Livro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LivroRepository extends JpaRepository<Livro, Long> {

    Optional<Livro> findByIsbn(String isbn);

    /**
     * Busca na rede (RN09 / UC01).
     *
     * IMPORTANTE — por que não usamos ":param IS NULL":
     * quando o Hibernate envia um parâmetro nulo, o PostgreSQL não consegue
     * inferir o tipo dele e assume "bytea". Aí a query quebra com
     * "função lower(bytea) não existe".
     *
     * A solução é nunca mandar nulo: o LivroService troca cada filtro vazio
     * por um valor-sentinela ("" para texto, 0 para número). Como o parâmetro
     * sempre chega tipado, o PostgreSQL resolve a query sem ambiguidade.
     */
    @Query("""
        SELECT l FROM Livro l
        WHERE (:termo = ''
               OR LOWER(l.titulo) LIKE LOWER(CONCAT('%', :termo, '%'))
               OR LOWER(l.autor)  LIKE LOWER(CONCAT('%', :termo, '%'))
               OR LOWER(COALESCE(l.isbn, '')) LIKE LOWER(CONCAT('%', :termo, '%')))
          AND (:autor = '' OR LOWER(l.autor) LIKE LOWER(CONCAT('%', :autor, '%')))
          AND (:isbn  = '' OR LOWER(COALESCE(l.isbn, '')) LIKE LOWER(CONCAT('%', :isbn, '%')))
          AND (:categoriaId = 0 OR l.categoria.id = :categoriaId)
          AND (:anoDe  = 0 OR (l.anoPublicacao IS NOT NULL AND l.anoPublicacao >= :anoDe))
          AND (:anoAte = 0 OR (l.anoPublicacao IS NOT NULL AND l.anoPublicacao <= :anoAte))
        ORDER BY l.titulo ASC
    """)
    List<Livro> buscar(@Param("termo") String termo,
                       @Param("autor") String autor,
                       @Param("isbn") String isbn,
                       @Param("categoriaId") Long categoriaId,
                       @Param("anoDe") Integer anoDe,
                       @Param("anoAte") Integer anoAte);
}