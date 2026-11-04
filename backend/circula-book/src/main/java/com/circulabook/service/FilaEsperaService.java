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
 * livre em uma biblioteca (devolução, chegada de transferência, expiração ou
 * cancelamento de reserva, cadastro), este especialista olha a fila daquela
 * biblioteca: sem fila, o exemplar fica DISPONIVEL; com fila, vai direto a
 * RESERVADO e atende o primeiro, decidindo entre:
 *   - retirada na própria biblioteca  -> reserva DISPONIVEL (3 dias);
 *   - retirada em outra biblioteca    -> vincula o exemplar ao pedido de
 *                                        transferência e, se já aprovado, despacha.
 *
 * É chamado de forma síncrona, na mesma transação de quem liberou o exemplar.
 * As mudanças de status passam pela máquina de estados (EstadoExemplarService).
 */
@Service
public class FilaEsperaService {

    private static final Logger log = LoggerFactory.getLogger(FilaEsperaService.class);

    public static final int DIAS_PARA_RETIRADA = 3; // RN03

    @Autowired private ReservaRepository reservaRepository;
    @Autowired private SolicitacaoTransferenciaRepository transferenciaRepository;
    @Autowired private EstadoExemplarService estadoExemplar;
    @Autowired private RegrasTransferenciaService regras;

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
            atender(fila.get(0), exemplar);
        }
        estadoExemplar.sincronizarMarcaDeFila(exemplar.getLivro(), exemplar.getBiblioteca());
    }

    /** O exemplar (já RESERVADO) fica separado para esta reserva, a 1ª da fila. */
    private void atender(Reserva reserva, Exemplar exemplar) {
        reserva.setExemplar(exemplar);

        SolicitacaoTransferencia pedido = transferenciaRepository
            .findFirstByReservaAndStatusIn(reserva, List.of("PENDENTE", "APROVADA"))
            .orElse(null);

        // Sem transferência (ou pedido rejeitado/cancelado): retirada na própria biblioteca
        if (pedido == null) {
            liberarParaRetirada(reserva, exemplar);
            return;
        }

        // Com transferência: vincula o exemplar ao pedido
        pedido.setExemplar(exemplar);

        // RN15 no despacho: antes de sair, a origem precisa continuar com o livro; se a regra
        // deixou de valer, o pedido é cancelado e a reserva é atendida na própria origem (3 dias).
        if ("APROVADA".equals(pedido.getStatus())) {
            String motivo = regras.motivoBloqueioOrigem(reserva.getLivro(), pedido.getBibliotecaOrigem(), pedido);
            if (motivo != null) {
                pedido.setStatus("CANCELADA");
                pedido.setDataConclusao(LocalDateTime.now());
                pedido.setObservacoes("Cancelada no despacho: " + motivo + " A reserva segue com retirada na "
                    + pedido.getBibliotecaOrigem().getNome() + ".");
                transferenciaRepository.save(pedido);
                reserva.setBibliotecaDestino(reserva.getBibliotecaFila());
                liberarParaRetirada(reserva, exemplar);
                log.info("[FILA] Transferência #" + pedido.getId() + " cancelada no despacho (RN15).");
                return;
            }
        }

        reserva.setStatus("AGUARDANDO_TRANSFERENCIA");
        reservaRepository.save(reserva);

        if ("APROVADA".equals(pedido.getStatus())) {
            despachar(pedido, null);              // já aprovada: segue viagem agora (T4 + T9 na mesma transação)
        } else {
            transferenciaRepository.save(pedido); // PENDENTE: espera o Admin decidir
            log.info("[FILA] Exemplar nº " + exemplar.getId()
                + " separado para " + reserva.getUsuario().getNome()
                + ", aguardando aprovação da transferência #" + pedido.getId() + ".");
        }
    }

    /** Reserva fica DISPONIVEL e o usuário ganha 3 dias para retirar. */
    @Transactional
    public void liberarParaRetirada(Reserva reserva, Exemplar exemplar) {
        reserva.setExemplar(exemplar);
        reserva.setStatus("DISPONIVEL");
        reserva.setDataExpiracao(LocalDateTime.now().plusDays(DIAS_PARA_RETIRADA));
        reservaRepository.save(reserva);

        log.info("[FILA] Exemplar nº " + exemplar.getId() + " de " + exemplar.getLivro().getTitulo()
            + " separado para " + reserva.getUsuario().getNome()
            + ": retirada na " + reserva.getBibliotecaDestino().getNome()
            + " em até " + DIAS_PARA_RETIRADA + " dias.");
    }

    /** Pedido aprovado + exemplar vinculado => EM_TRANSITO e exemplar EM_TRANSFERENCIA. */
    @Transactional
    public void despachar(SolicitacaoTransferencia pedido, Usuario aprovador) {
        Exemplar exemplar = pedido.getExemplar();

        if (aprovador != null) pedido.setAprovador(aprovador);
        pedido.setStatus("EM_TRANSITO");
        transferenciaRepository.save(pedido);

        estadoExemplar.mudarStatus(exemplar, EM_TRANSFERENCIA); // T8 (avulsa) ou T9 (reserva)

        log.info("[FILA] Transferência #" + pedido.getId() + " em trânsito: "
            + pedido.getBibliotecaOrigem().getNome() + " -> " + pedido.getBibliotecaDestino().getNome());
    }

    /**
     * Retirada vencida: a reserva expira e o exemplar FICA onde está
     * (se já chegou na biblioteca de retirada, passa a fazer parte do acervo dela)
     * e atende o próximo da fila ou fica DISPONIVEL. Roda a cada minuto.
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
