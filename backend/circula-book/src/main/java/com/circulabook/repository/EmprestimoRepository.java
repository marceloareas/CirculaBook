package com.circulabook.repository;

import com.circulabook.model.Emprestimo;
import com.circulabook.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmprestimoRepository extends JpaRepository<Emprestimo, Long> {

    // RN01: conta quantos exemplares o usuário tem em mãos agora
    List<Emprestimo> findByUsuarioAndStatusIn(Usuario usuario, List<String> status);

    List<Emprestimo> findByStatusInOrderByDataPrevDevolucaoAsc(List<String> status);

}
