package com.circulabook.repository;

import com.circulabook.model.Usuario;
import com.circulabook.model.Biblioteca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    List<Usuario> findByTipo(String tipo);

    // RN22: destino de transferência precisa de ao menos um bibliotecário ativo
    boolean existsByTipoAndBibliotecaAndAtivoTrue(String tipo, Biblioteca biblioteca);

}
