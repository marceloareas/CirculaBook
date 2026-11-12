package com.circulabook.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.circulabook.dto.DestinoRetiradaDTO;
import com.circulabook.dto.MinhaReservaDTO;
import com.circulabook.dto.MinhaReservaDTO.TransferenciaDaReserva;
import com.circulabook.model.*;
import com.circulabook.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Especialista de Reserva (UC03 / UC07 / RN03).
 *
 * Reserva = fila de espera de UMA biblioteca. O usuário pode retirar na própria
 * biblioteca da fila ou em outra que não possua o título (nesse caso nasce
 * também um pedido de transferência para o Admin avaliar).
 */
@Service
public class ReservaService {

    private static final Logger log = LoggerFactory.getLogger(ReservaService.class);

    private static final List<String> STATUS_ATIVOS =
        List.of("PENDENTE", "AGUARDANDO_TRANSFERENCIA", "DISPONIVEL");

    @Autowired private ReservaRepository reservaRepository;
    @Autowired private LivroRepository livroRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private BibliotecaRepository bibliotecaRepository;
    @Autowired private ExemplarRepository exemplarRepository;
    @Autowired private EstadoExemplarService estadoExemplar;
    @Autowired private EmprestimoRepository emprestimoRepository;
    @Autowired private FilaEsperaService filaEsperaService;
    @Autowired private TransferenciaService transferenciaService;
    @Autowired private SolicitacaoTransferenciaRepository transferenciaRepository;
    @Autowired private RegrasTransferenciaService regras;

    /** Posição que o usuário ocupará na fila daquela biblioteca (resumo da tela de reserva). */
    public long posicaoNaFila(Long livroId, Long bibliotecaId) {
        Livro livro = livroRepository.findById(livroId)
            .orElseThrow(() -> new RuntimeException("Livro não encontrado: ID " + livroId));
        Biblioteca biblioteca = bibliotecaRepository.findById(bibliotecaId)
            .orElseThrow(() -> new RuntimeException("Biblioteca não encontrada: ID " + bibliotecaId));
        return reservaRepository.countByLivroAndBibliotecaFilaAndStatus(livro, biblioteca, "PENDENTE") + 1;
    }

    /**
     * UC03 — Entrar na fila de espera (§5.1).
     *
     * Regras:
     *  1) só usuário COMUM, sem reserva ativa do título e sem o título emprestado;
     *  2) a biblioteca da fila precisa ter o título e NENHUM exemplar disponível;
     *  3) retirar em outra biblioteca exige destino sem nenhum exemplar do título,
     *     que a origem não fique sem o livro (RN15) e destino apto a receber (RN22);
     *  4) retirar em outra biblioteca gera um pedido de transferência (PENDENTE, sem exemplar).
     * A posição devolvida conta só as reservas PENDENTE do título naquela biblioteca.
     */
    @Transactional
    public Reserva criar(Long livroId, Long usuarioId, Long bibliotecaFilaId, Long bibliotecaDestinoId) {

        Livro livro = livroRepository.findById(livroId)
            .orElseThrow(() -> new RuntimeException("Livro não encontrado: ID " + livroId));

        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: ID " + usuarioId));

        if (!"COMUM".equals(usuario.getTipo())) {
            throw new RuntimeException("Somente usuários da comunidade podem fazer reservas.");
        }

        // ── Regra 1: uma reserva ativa por título, e nada de reservar o que já está com você ──
        if (!reservaRepository.findByLivroAndUsuarioAndStatusIn(livro, usuario, STATUS_ATIVOS).isEmpty()) {
            throw new RuntimeException("Você já possui uma reserva ativa para este título.");
        }
        boolean jaEmprestado = emprestimoRepository
            .findByUsuarioAndStatusIn(usuario, List.of("ATIVO", "ATRASADO")).stream()
            .anyMatch(e -> e.getExemplar().getLivro().getId().equals(livro.getId()));
        if (jaEmprestado) {
            throw new RuntimeException("Você já está com um exemplar de \"" + livro.getTitulo()
                + "\" emprestado e não pode reservar o mesmo título.");
        }

        if (bibliotecaFilaId == null) {
            throw new RuntimeException("Informe a biblioteca da fila de espera.");
        }
        // Sem destino informado, a retirada é na própria biblioteca da fila
        Long retiradaId = (bibliotecaDestinoId != null) ? bibliotecaDestinoId : bibliotecaFilaId;

        Biblioteca fila = bibliotecaRepository.findById(bibliotecaFilaId)
            .orElseThrow(() -> new RuntimeException("Biblioteca não encontrada: ID " + bibliotecaFilaId));
        Biblioteca destino = bibliotecaRepository.findById(retiradaId)
            .orElseThrow(() -> new RuntimeException("Biblioteca não encontrada: ID " + retiradaId));

        // ── Regra 2: reserva é por biblioteca ──
        validarFila(livro, fila);

        // ── Regra 3: retirada em outra biblioteca ──
        boolean comTransferencia = !fila.getId().equals(destino.getId());
        if (comTransferencia) {
            String motivo = motivoBloqueioRetirada(livro, fila, destino);
            if (motivo != null) throw new RuntimeException(motivo);
        }

        Reserva reserva = new Reserva();
        reserva.setLivro(livro);
        reserva.setUsuario(usuario);
        reserva.setBibliotecaFila(fila);
        reserva.setBibliotecaDestino(destino);
        reserva.setDataReserva(LocalDateTime.now());
        reserva.setDataExpiracao(LocalDateTime.now().plusDays(FilaEsperaService.DIAS_PARA_RETIRADA));
        reserva.setStatus("PENDENTE");
        reservaRepository.save(reserva);
        // Com a fila, os emprestados do título nesta biblioteca viram EMPRESTADO_RESERVADO
        estadoExemplar.sincronizarMarcaDeFila(livro, fila);

        // ── Regra 4: a transferência é consequência da reserva ──
        if (comTransferencia) {
            transferenciaService.criarPedidoDeReserva(reserva);
        }

        // Entrou por último: a posição é o tamanho da fila daquela biblioteca
        reserva.setPosicaoFila((int) reservaRepository.countByLivroAndBibliotecaFilaAndStatus(
            livro, fila, "PENDENTE"));

        log.info("[CIRCULA BOOK] Reserva criada: " + livro.getTitulo()
            + " para " + usuario.getNome() + " | Fila: " + fila.getNome()
            + " (posição " + reserva.getPosicaoFila() + ") | Retirada: " + destino.getNome()
            + (comTransferencia ? " (com pedido de transferência)" : ""));

        return reserva;
    }

    /**
     * Tela de reserva — "retirar em outra biblioteca": todas as bibliotecas ativas,
     * menos a da fila, cada uma dizendo se pode ser escolhida e, se não, por quê.
     * Recusa (400) se a fila em si não é válida (sem o título ou com exemplar disponível).
     */
    public List<DestinoRetiradaDTO> destinosPossiveis(Long livroId, Long bibliotecaFilaId) {
        Livro livro = livroRepository.findById(livroId)
            .orElseThrow(() -> new RuntimeException("Livro não encontrado: ID " + livroId));
        Biblioteca fila = bibliotecaRepository.findById(bibliotecaFilaId)
            .orElseThrow(() -> new RuntimeException("Biblioteca não encontrada: ID " + bibliotecaFilaId));
        validarFila(livro, fila);

        List<DestinoRetiradaDTO> destinos = new ArrayList<>();
        for (Biblioteca b : bibliotecaRepository.findByAtivaTrue()) {
            if (b.getId().equals(fila.getId())) continue;
            String motivo = motivoBloqueioRetirada(livro, fila, b);
            destinos.add(new DestinoRetiradaDTO(b.getId(), b.getNome(), motivo == null, motivo));
        }
        destinos.sort(Comparator.comparing(DestinoRetiradaDTO::nome));
        return destinos;
    }

    /** Minhas reservas — reservas ativas do usuário, a mais recente primeiro, com a posição na fila. */
    public List<MinhaReservaDTO> minhasReservas(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: ID " + usuarioId));
        return reservaRepository.findByUsuarioAndStatusIn(usuario, STATUS_ATIVOS).stream()
            .sorted(Comparator.comparing(Reserva::getDataReserva).reversed())
            .map(r -> new MinhaReservaDTO(r.getId(), r.getLivro().getId(), r.getLivro().getTitulo(),
                r.getLivro().getAutor(),
                r.getBibliotecaFila().getId(), r.getBibliotecaFila().getNome(),
                r.getBibliotecaDestino().getId(), r.getBibliotecaDestino().getNome(),
                "PENDENTE".equals(r.getStatus()) ? posicaoAtual(r) : null,
                r.getStatus(), r.getDataReserva(),
                "DISPONIVEL".equals(r.getStatus()) ? r.getDataExpiracao() : null,
                transferenciaRepository.findFirstByReservaOrderByDataSolicitacaoDescIdDesc(r)
                    .map(this::situacao).orElse(null)))
            .toList();
    }

    private Integer posicaoAtual(Reserva reserva) {
        List<Reserva> fila = reservaRepository.findByLivroAndBibliotecaFilaAndStatusOrderByDataReservaAsc(
            reserva.getLivro(), reserva.getBibliotecaFila(), "PENDENTE");
        for (int i = 0; i < fila.size(); i++) {
            if (fila.get(i).getId().equals(reserva.getId())) return i + 1;
        }
        return null;
    }

    /** Etapa do pedido de transferência, em texto para o usuário. */
    private TransferenciaDaReserva situacao(SolicitacaoTransferencia s) {
        String origem = s.getBibliotecaOrigem().getNome();
        String destino = s.getBibliotecaDestino().getNome();
        boolean comExemplar = s.getExemplar() != null;
        String etapa;
        String descricao;
        switch (s.getStatus()) {
            case "PENDENTE" -> {
                etapa = comExemplar ? "PENDENTE_COM_EXEMPLAR" : "PENDENTE";
                descricao = comExemplar
                    ? "Exemplar separado na " + origem + ", aguardando a aprovação do administrador."
                    : "Transferência para a " + destino + " aguardando a aprovação do administrador.";
            }
            case "APROVADA" -> {
                etapa = "APROVADA_AGUARDANDO_EXEMPLAR";
                descricao = "Transferência aprovada, aguardando um exemplar ser devolvido na " + origem + ".";
            }
            case "EM_TRANSITO" -> {
                etapa = "EM_TRANSITO";
                descricao = "Exemplar a caminho: " + origem + " → " + destino + ".";
            }
            case "CONCLUIDA" -> {
                etapa = "CONCLUIDA";
                descricao = "O exemplar chegou à " + destino + ".";
            }
            case "REJEITADA" -> {
                etapa = "REJEITADA";
                descricao = "Transferência rejeitada pelo administrador: a retirada será na " + origem + "."
                    + (s.getMotivoRejeicao() != null ? " Motivo da rejeição: " + s.getMotivoRejeicao() : "");
            }
            default -> {
                etapa = s.getStatus();
                descricao = "Transferência cancelada: a retirada será na " + origem + ".";
            }
        }
        return new TransferenciaDaReserva(s.getId(), s.getStatus(), etapa, descricao);
    }

    /**
     * UC07 — Cancelar reserva (PENDENTE, AGUARDANDO_TRANSFERENCIA ou DISPONIVEL).
     *  - pedido de transferência PENDENTE/APROVADA é cancelado; o exemplar já separado
     *    (RESERVADO) atende o próximo da fila ou volta a ficar DISPONIVEL;
     *  - pedido EM_TRANSITO não é tocado: a viagem continua e, na chegada, o exemplar
     *    entra no acervo do destino (DISPONIVEL) ou atende o 1º da fila de lá;
     *  - se a fila esvaziou, os emprestados voltam a EMPRESTADO.
     */
    @Transactional
    public Reserva cancelar(Long reservaId) {
        Reserva reserva = reservaRepository.findById(reservaId)
            .orElseThrow(() -> new RuntimeException("Reserva não encontrada: ID " + reservaId));

        if (!STATUS_ATIVOS.contains(reserva.getStatus())) {
            throw new RuntimeException("Esta reserva não pode mais ser cancelada.");
        }

        // Marca CANCELADA antes de liberar o exemplar, para ela não ser atendida de novo
        reserva.setStatus("CANCELADA");
        reservaRepository.save(reserva);

        transferenciaService.cancelarPorReserva(reserva);

        Exemplar exemplar = reserva.getExemplar();
        if (exemplar != null && StatusExemplar.RESERVADO.equals(exemplar.getStatus())) {
            filaEsperaService.liberar(exemplar);
        }
        estadoExemplar.sincronizarMarcaDeFila(reserva.getLivro(), reserva.getBibliotecaFila());

        log.info("[CIRCULA BOOK] Reserva #" + reserva.getId() + " cancelada por "
            + reserva.getUsuario().getNome() + ".");
        return reserva;
    }

    /** Só entra na fila de biblioteca que tem o título e não tem exemplar livre. */
    private void validarFila(Livro livro, Biblioteca biblioteca) {
        List<Exemplar> exemplares = exemplarRepository.findByLivroAndBiblioteca(livro, biblioteca);
        if (exemplares.isEmpty()) {
            throw new RuntimeException("A " + biblioteca.getNome()
                + " não possui exemplares deste título, então não há fila para entrar.");
        }
        long livres = exemplares.stream().filter(e -> StatusExemplar.DISPONIVEL.equals(e.getStatus())).count();
        if (livres > 0) {
            throw new RuntimeException("A " + biblioteca.getNome() + " tem " + livres
                + " exemplar(es) disponível(is). A reserva só vale quando todos estão emprestados; "
                + "faça o empréstimo presencialmente.");
        }
    }

    /**
     * §5.1 item 4: por que não dá para retirar no destino (ou null se dá).
     * Ordem: destino já tem o título; origem ficaria sem o livro (RN15); destino sem bibliotecário (RN22).
     */
    private String motivoBloqueioRetirada(Livro livro, Biblioteca fila, Biblioteca destino) {
        if (!exemplarRepository.findByLivroAndBiblioteca(livro, destino).isEmpty()) {
            return "A " + destino.getNome() + " já possui exemplares deste título. "
                + "Para retirar lá, entre na fila dessa biblioteca ou faça o empréstimo presencial.";
        }
        String motivo = regras.motivoBloqueioOrigem(livro, fila);
        return motivo != null ? motivo : regras.motivoBloqueioDestino(destino);
    }
}
