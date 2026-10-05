package com.circulabook.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.circulabook.model.*;
import static com.circulabook.model.StatusExemplar.*;
import com.circulabook.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Especialista de Fila — Knowledge Source da arquitetura Blackboard.
 *
 * O "quadro" é o estado dos exemplares no banco. Sempre que um exemplar fica
 * livre em uma biblioteca (devolução ou expiração de reserva), este especialista
 * olha a fila daquela biblioteca: sem fila, o exemplar fica DISPONIVEL; com fila,
 * vai direto a RESERVADO e a reserva do primeiro fica pronta para retirada (3 dias).
 *
 * É chamado de forma síncrona, na mesma transação de quem liberou o exemplar.
 * As mudanças de status passam pela máquina de estados (EstadoExemplarService).
 */
@Service
public class FilaEsperaService {

    private static final Logger log = LoggerFactory.getLogger(FilaEsperaService.class);

    public static final int DIAS_PARA_RETIRADA = 3; // RN03

    @Autowired private ReservaRepository reservaRepository;
    @Autowired private EstadoExemplarService estadoExemplar;

    /**
     * Chamar sempre que um exemplar ficar livre na biblioteca em que está.
     * Sem fila do título ali: DISPONIVEL. Com fila: RESERVADO para o 1º,
     * sem passar por DISPONIVEL. Ao final reavalia a invariante da fila.
     */
    @Transactional
    public void liberar(Exemplar exemplar) {
        List<Reserva> fila = reservaRepository
            .findByLivroAndBibliotecaFilaAndStatusOrderByDataReservaAsc(
                exemplar.getLivro(), exemplar.getBiblioteca(), "PENDENTE");
        if (fila.isEmpty()) {
            estadoExemplar.mudarStatus(exemplar, DISPONIVEL);
        } else {
            estadoExemplar.mudarStatus(exemplar, RESERVADO);
            liberarParaRetirada(fila.get(0), exemplar);
        }
        estadoExemplar.sincronizarMarcaDeFila(exemplar.getLivro(), exemplar.getBiblioteca());
    }

    /** Reserva fica DISPONIVEL e o usuário ganha 3 dias para retirar. */
    private void liberarParaRetirada(Reserva reserva, Exemplar exemplar) {
        reserva.setExemplar(exemplar);
        reserva.setStatus("DISPONIVEL");
        reserva.setDataExpiracao(LocalDateTime.now().plusDays(DIAS_PARA_RETIRADA));
        reservaRepository.save(reserva);

        log.info("[FILA] Exemplar nº " + exemplar.getId() + " de " + exemplar.getLivro().getTitulo()
            + " separado para " + reserva.getUsuario().getNome()
            + ": retirada na " + reserva.getBibliotecaFila().getNome()
            + " em até " + DIAS_PARA_RETIRADA + " dias.");
    }

    /**
     * Retirada vencida: a reserva expira e o exemplar volta para a fila
     * (atende o próximo) ou fica DISPONIVEL. Roda a cada minuto.
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void expirarVencidas() {
        List<Reserva> vencidas = reservaRepository
            .findByStatusAndDataExpiracaoBefore("DISPONIVEL", LocalDateTime.now());

        for (Reserva reserva : vencidas) {
            reserva.setStatus("EXPIRADA");
            reservaRepository.save(reserva);

            Exemplar exemplar = reserva.getExemplar();
            if (exemplar != null && RESERVADO.equals(exemplar.getStatus())) {
                liberar(exemplar);
            }
            estadoExemplar.sincronizarMarcaDeFila(reserva.getLivro(), reserva.getBibliotecaFila());
            log.info("[FILA] Reserva #" + reserva.getId() + " expirou.");
        }
    }
}
