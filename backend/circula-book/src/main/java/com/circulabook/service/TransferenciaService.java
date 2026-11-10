package com.circulabook.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.circulabook.dto.ContaDTOs.Pagina;
import com.circulabook.dto.DestinoRetiradaDTO;
import com.circulabook.dto.TransferenciaDTOs.*;
import com.circulabook.model.*;
import com.circulabook.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Especialista de Transferência (UC13 / UC15 / UC24, §5.2 a §5.4).
 *
 * A transferência só nasce de duas formas:
 *  - criarPedidoDeReserva: consequência de uma reserva com retirada em outra biblioteca;
 *  - criarAvulsas: iniciativa do Admin (nasce aprovada e já sai em trânsito).
 * Aprovar/rejeitar é do Admin (RN04); confirmar a chegada é do bibliotecário do destino (RN16).
 * O despacho na devolução fica no FilaEsperaService; as regras RN15/RN22 no RegrasTransferenciaService.
 *
 * Cancelamento: o código usa "CANCELADA" em todos os pontos (a §5.3 fala em "CANCELADO").
 */
@Service
public class TransferenciaService {

    private static final Logger log = LoggerFactory.getLogger(TransferenciaService.class);

    private static final List<String> RESERVA_ATIVA =
        List.of("PENDENTE", "AGUARDANDO_TRANSFERENCIA", "DISPONIVEL");

    @Autowired private SolicitacaoTransferenciaRepository transferenciaRepository;
    @Autowired private ExemplarRepository exemplarRepository;
    @Autowired private BibliotecaRepository bibliotecaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ReservaRepository reservaRepository;
    @Autowired private HistoricoService historicoService;
    @Autowired private FilaEsperaService filaEsperaService;
    @Autowired private EstadoExemplarService estadoExemplar;
    @Autowired private RegrasTransferenciaService regras;
    @Autowired private NotificacaoService notificacoes;

    public List<SolicitacaoTransferencia> obterTodas() {
        return transferenciaRepository.findAll();
    }

    public List<SolicitacaoTransferencia> obterPendentes() {
        return transferenciaRepository.findByStatusOrderByDataSolicitacaoAsc("PENDENTE");
    }

    public long contarPorStatus(String status) {
        return transferenciaRepository.countByStatus(status);
    }

    public SolicitacaoTransferencia buscar(Long id) {
        return transferenciaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transferência não encontrada: ID " + id));
    }

    // ───────────────────────── Listagens ─────────────────────────

    /** A2 — pedidos aguardando decisão, com exemplar retido ou não e a situação da RN15. */
    public List<PedidoPendente> pedidosPendentes() {
        return obterPendentes().stream().map(s -> {
            RegrasTransferenciaService.Capacidade c = regras.capacidade(s.getLivro(), s.getBibliotecaOrigem(), s);
            String motivo = regras.motivoBloqueioOrigem(s.getLivro(), s.getBibliotecaOrigem(), s);
            Exemplar e = s.getExemplar();
            return new PedidoPendente(s.getId(), s.getLivro().getId(), s.getLivro().getTitulo(),
                s.getLivro().getAutor(), ref(s.getSolicitante()), ref(s.getBibliotecaOrigem()),
                ref(s.getBibliotecaDestino()),
                s.getReserva() != null ? s.getReserva().getId() : null,
                e != null ? e.getId() : null,
                e != null ? "RETIDO" : "VINCULADO_NA_DEVOLUCAO",
                e != null
                    ? "Exemplar nº " + e.getId() + " já separado na " + s.getBibliotecaOrigem().getNome()
                      + ": aprovar o envia na hora."
                    : "Será vinculado quando um exemplar for devolvido na " + s.getBibliotecaOrigem().getNome() + ".",
                new SituacaoOrigem(c.total(), c.abertas(), motivo == null, motivo),
                regras.motivoBloqueioDestino(s.getBibliotecaDestino()),
                s.getDataSolicitacao());
        }).toList();
    }

    /** A2 — acompanhamento: todas as transferências, mais recentes primeiro, com filtro por status. */
    public Pagina<Transferencia> acompanhamento(String status, int pagina, int tamanho) {
        if (pagina < 0) throw new RuntimeException("A página começa em 0.");
        if (tamanho < 1 || tamanho > 50) throw new RuntimeException("O tamanho da página deve ser de 1 a 50.");
        String st = status == null || status.isBlank() ? null : status.trim().toUpperCase();
        List<Transferencia> todas = transferenciaRepository.findAll().stream()
            .filter(s -> st == null || st.equals(s.getStatus())
                || (st.equals("APROVADA_AGUARDANDO_EXEMPLAR") && etapa(s).equals(st)))
            .sorted(Comparator.comparing(SolicitacaoTransferencia::getDataSolicitacao,
                    Comparator.nullsLast(Comparator.naturalOrder())).reversed()
                .thenComparing(SolicitacaoTransferencia::getId, Comparator.reverseOrder()))
            .map(this::paraResumo)
            .toList();
        int total = todas.size();
        int inicio = Math.min(pagina * tamanho, total);
        int fim = Math.min(inicio + tamanho, total);
        return new Pagina<>(todas.subList(inicio, fim), pagina, tamanho, total,
            (int) Math.ceil(total / (double) tamanho));
    }

    /**
     * A3 — destinos possíveis da avulsa: bibliotecas ativas, cada uma dizendo se aceita
     * receber (RN22) e, se não, por quê. Sem a restrição de "destino sem o título".
     */
    public List<DestinoRetiradaDTO> destinosAvulsa() {
        return bibliotecaRepository.findByAtivaTrue().stream()
            .sorted(Comparator.comparing(Biblioteca::getNome))
            .map(b -> {
                String motivo = regras.motivoBloqueioDestino(b);
                return new DestinoRetiradaDTO(b.getId(), b.getNome(), motivo == null, motivo);
            })
            .toList();
    }

    /** B5 — "A receber": em trânsito com destino na biblioteca. */
    public List<Transferencia> aReceber(Long bibliotecaId) {
        return transferenciaRepository.findByStatusOrderByDataSolicitacaoAsc("EM_TRANSITO").stream()
            .filter(s -> s.getBibliotecaDestino().getId().equals(bibliotecaId))
            .map(this::paraResumo).toList();
    }

    /** B5 — "Saindo" (somente leitura): pedidos abertos com origem na biblioteca. */
    public List<Transferencia> saindo(Long bibliotecaId) {
        return transferenciaRepository.findAll().stream()
            .filter(s -> RegrasTransferenciaService.TRANSFERENCIA_ABERTA.contains(s.getStatus())
                && s.getBibliotecaOrigem().getId().equals(bibliotecaId))
            .sorted(Comparator.comparing(SolicitacaoTransferencia::getId))
            .map(this::paraResumo).toList();
    }

    // ───────────────────────── Criação ─────────────────────────

    /**
     * Chamado pelo ReservaService quando o usuário escolhe retirar em outra biblioteca.
     * O pedido nasce PENDENTE e SEM exemplar: o exemplar é vinculado depois,
     * quando algum for devolvido na biblioteca da fila (FilaEsperaService).
     */
    @Transactional
    public SolicitacaoTransferencia criarPedidoDeReserva(Reserva reserva) {
        SolicitacaoTransferencia s = new SolicitacaoTransferencia();
        s.setLivro(reserva.getLivro());
        s.setExemplar(null);
        s.setBibliotecaOrigem(reserva.getBibliotecaFila());
        s.setBibliotecaDestino(reserva.getBibliotecaDestino());
        s.setSolicitante(reserva.getUsuario());
        s.setReserva(reserva);
        s.setStatus("PENDENTE");
        s.setDataSolicitacao(LocalDateTime.now());
        s.setObservacoes("Pedido gerado pela reserva de " + reserva.getUsuario().getNome()
            + ": fila na " + reserva.getBibliotecaFila().getNome()
            + ", retirada na " + reserva.getBibliotecaDestino().getNome()
            + ". O exemplar será vinculado quando for devolvido.");
        transferenciaRepository.save(s);
        notificacoes.pedidoCriado(s);

        log.info("[BLACKBOARD] Pedido de transferência #" + s.getId() + " criado pela reserva #"
            + reserva.getId() + " (aguardando decisão do Admin).");
        return s;
    }

    /**
     * A3 / §5.4 — transferência AVULSA em lote: sem reserva e sem a restrição de
     * "destino sem o título". É tudo ou nada: valida todos os exemplares e, por grupo
     * (origem, título), {@code abertas + selecionados <= total - 1}; havendo qualquer
     * violação, nada é criado e a mensagem lista cada uma. Cada exemplar vira uma
     * transferência APROVADA que segue na hora para EM_TRANSITO (T8).
     */
    @Transactional
    public List<SolicitacaoTransferencia> criarAvulsas(List<Long> exemplarIds, Long bibliotecaDestinoId,
                                                       Long adminId, String observacoes) {
        Usuario admin = validarAdmin(adminId);
        if (exemplarIds == null || exemplarIds.isEmpty()) {
            throw new RuntimeException("Selecione ao menos um exemplar.");
        }
        if (bibliotecaDestinoId == null) {
            throw new RuntimeException("Informe a biblioteca de destino.");
        }
        Biblioteca destino = bibliotecaRepository.findById(bibliotecaDestinoId)
            .orElseThrow(() -> new RuntimeException("Biblioteca não encontrada: ID " + bibliotecaDestinoId));

        List<String> erros = new ArrayList<>();
        String bloqueioDestino = regras.motivoBloqueioDestino(destino);
        if (bloqueioDestino != null) erros.add(bloqueioDestino);

        List<Exemplar> exemplares = new ArrayList<>();
        Set<Long> vistos = new HashSet<>();
        for (Long id : exemplarIds) {
            if (!vistos.add(id)) {
                erros.add("Exemplar nº " + id + " foi selecionado mais de uma vez.");
                continue;
            }
            Optional<Exemplar> opt = exemplarRepository.findById(id);
            if (opt.isEmpty()) {
                erros.add("Exemplar nº " + id + " não existe.");
                continue;
            }
            Exemplar e = opt.get();
            // RN04 / ES-14 — avulsa só leva exemplar DISPONIVEL
            if (!StatusExemplar.DISPONIVEL.equals(e.getStatus())) {
                erros.add("Exemplar nº " + id + " (" + e.getLivro().getTitulo() + ") está "
                    + StatusExemplar.rotulo(e.getStatus()).toLowerCase() + "; só exemplares disponíveis podem ser transferidos.");
                continue;
            }
            if (e.getBiblioteca().getId().equals(destino.getId())) {
                erros.add("Exemplar nº " + id + " (" + e.getLivro().getTitulo() + ") já está na " + destino.getNome() + ".");
                continue;
            }
            exemplares.add(e);
        }

        // RN15 por grupo (origem, título)
        Map<String, List<Exemplar>> grupos = new LinkedHashMap<>();
        for (Exemplar e : exemplares) {
            grupos.computeIfAbsent(e.getBiblioteca().getId() + ":" + e.getLivro().getId(), k -> new ArrayList<>()).add(e);
        }
        for (List<Exemplar> g : grupos.values()) {
            Exemplar primeiro = g.get(0);
            RegrasTransferenciaService.Capacidade c =
                regras.capacidade(primeiro.getLivro(), primeiro.getBiblioteca(), null);
            if (!c.permite(g.size())) {
                erros.add("\"" + primeiro.getLivro().getTitulo() + "\" na " + primeiro.getBiblioteca().getNome()
                    + ": " + g.size() + " selecionado(s), mas só " + Math.max(0, c.cabem())
                    + " pode(m) sair (" + c.total() + " exemplar(es), " + c.abertas()
                    + " transferência(s) em andamento); a biblioteca não pode ficar sem o livro.");
            }
        }

        if (!erros.isEmpty()) {
            throw new RuntimeException("Nenhuma transferência foi criada:\n- " + String.join("\n- ", erros));
        }

        List<SolicitacaoTransferencia> criadas = new ArrayList<>();
        for (Exemplar exemplar : exemplares) {
            SolicitacaoTransferencia s = new SolicitacaoTransferencia();
            s.setLivro(exemplar.getLivro());
            s.setExemplar(exemplar);
            s.setBibliotecaOrigem(exemplar.getBiblioteca());
            s.setBibliotecaDestino(destino);
            s.setSolicitante(admin);
            s.setAprovador(admin);
            s.setReserva(null);
            s.setStatus("APROVADA"); // RN14: nasce aprovada
            s.setDataSolicitacao(LocalDateTime.now());
            s.setObservacoes(observacoes != null && !observacoes.isBlank()
                ? observacoes
                : "Transferência avulsa criada pelo administrador " + admin.getNome() + ".");
            transferenciaRepository.save(s);
            filaEsperaService.despachar(s, admin); // T8: DISPONIVEL -> EM_TRANSFERENCIA
            criadas.add(s);
        }
        log.info("[BLACKBOARD] " + criadas.size() + " transferência(s) avulsa(s) para " + destino.getNome());
        return criadas;
    }

    // ───────────────────────── Decisão do Admin ─────────────────────────

    /**
     * UC13/UC24 — Aprovar (só ADMIN, RN04). Revalida RN15 e RN22.
     *  - sem exemplar ainda  -> APROVADA ("aguardando exemplar");
     *  - exemplar já retido (devolvido antes da decisão) -> EM_TRANSITO na hora (T9),
     *    com a reserva AGUARDANDO_TRANSFERENCIA.
     */
    @Transactional
    public SolicitacaoTransferencia aprovar(Long id, Long adminId) {
        Usuario admin = validarAdmin(adminId);
        SolicitacaoTransferencia s = buscarPendente(id);

        String motivo = regras.motivoBloqueioOrigem(s.getLivro(), s.getBibliotecaOrigem(), s);
        if (motivo == null) motivo = regras.motivoBloqueioDestino(s.getBibliotecaDestino());
        if (motivo != null) {
            throw new RuntimeException("Não é possível aprovar: " + motivo);
        }

        s.setAprovador(admin);
        notificacoes.pedidoAprovado(s);
        Exemplar exemplar = s.getExemplar();
        if (exemplar != null) {
            Reserva reserva = s.getReserva();
            if (reserva != null && !"AGUARDANDO_TRANSFERENCIA".equals(reserva.getStatus())) {
                reserva.setStatus("AGUARDANDO_TRANSFERENCIA");
                reservaRepository.save(reserva);
            }
            filaEsperaService.despachar(s, admin);
        } else {
            s.setStatus("APROVADA");
            transferenciaRepository.save(s);
        }

        log.info("[BLACKBOARD] Transferência #" + id + " aprovada por " + admin.getNome()
            + (exemplar == null ? " (aguardando exemplar)." : " (em trânsito)."));
        return s;
    }

    /**
     * UC13/UC24 — Rejeitar (só ADMIN, RN04).
     * A reserva NÃO é cancelada: continua na fila com retirada na própria biblioteca da fila.
     * Se havia exemplar retido, ele atende essa reserva na origem (DISPONIVEL por 3 dias).
     */
    @Transactional
    public SolicitacaoTransferencia rejeitar(Long id, Long adminId, String motivo) {
        Usuario admin = validarAdmin(adminId);
        SolicitacaoTransferencia s = buscarPendente(id);

        s.setStatus("REJEITADA");
        s.setAprovador(admin);
        s.setDataConclusao(LocalDateTime.now());

        Reserva reserva = s.getReserva();
        String obs = "Rejeitada pelo administrador" + (motivo != null && !motivo.isBlank() ? ": " + motivo : ".");
        if (reserva != null) {
            obs += " A reserva segue na fila com retirada na " + reserva.getBibliotecaFila().getNome() + ".";
        }
        s.setObservacoes(obs);
        transferenciaRepository.save(s);

        if (reserva != null && RESERVA_ATIVA.contains(reserva.getStatus())) {
            notificacoes.pedidoRejeitado(s);
            reserva.setBibliotecaDestino(reserva.getBibliotecaFila()); // retirada na origem

            Exemplar exemplar = s.getExemplar();
            if (exemplar != null && StatusExemplar.RESERVADO.equals(exemplar.getStatus())) {
                filaEsperaService.liberarParaRetirada(reserva, exemplar);
            } else {
                reservaRepository.save(reserva); // continua PENDENTE na fila
            }
            estadoExemplar.sincronizarMarcaDeFila(reserva.getLivro(), reserva.getBibliotecaFila());
        }

        log.info("[BLACKBOARD] Transferência #" + id + " rejeitada por " + admin.getNome());
        return s;
    }

    // ───────────────────────── Chegada ─────────────────────────

    /**
     * UC15 — Confirmar chegada (só EM_TRANSITO; só o bibliotecário do destino, RN16).
     * O exemplar passa a pertencer ao destino e a transferência fica CONCLUIDA.
     *  - chegou danificado: exemplar INDISPONIVEL no destino; a reserva do pedido volta a
     *    PENDENTE na fila da origem (mesma posição) com retirada na origem (§4.4);
     *  - reserva do pedido aguardando: T10 (RESERVADO) e reserva DISPONIVEL por 3 dias;
     *  - avulsa ou reserva já cancelada: T11 (DISPONIVEL), ou T10 para o 1º da fila do destino.
     */
    @Transactional
    public SolicitacaoTransferencia confirmarChegada(Long id, Long responsavelId, boolean danificado,
                                                     String observacao) {
        SolicitacaoTransferencia s = buscar(id);
        Usuario responsavel = usuarioRepository.findById(responsavelId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: ID " + responsavelId));
        if (!ehBibliotecarioDoDestino(responsavel, s)) {
            throw new RuntimeException("Apenas um bibliotecário da "
                + s.getBibliotecaDestino().getNome() + " pode confirmar a chegada.");
        }
        if (!"EM_TRANSITO".equals(s.getStatus()) || s.getExemplar() == null) {
            throw new RuntimeException("Só é possível confirmar a chegada de uma transferência "
                + "em trânsito. Status atual: " + s.getStatus() + ".");
        }

        Exemplar exemplar = s.getExemplar();
        Biblioteca origem = s.getBibliotecaOrigem();
        exemplar.setBiblioteca(s.getBibliotecaDestino()); // agora pertence ao destino

        s.setStatus("CONCLUIDA");
        s.setDataConclusao(LocalDateTime.now());
        if (danificado) {
            s.setObservacoes((s.getObservacoes() == null ? "" : s.getObservacoes() + " ")
                + "Chegou danificado" + (observacao != null && !observacao.isBlank() ? ": " + observacao : "."));
        }
        transferenciaRepository.save(s);

        String chegada = "Chegada confirmada na " + s.getBibliotecaDestino().getNome()
            + ", vinda da " + origem.getNome() + ".";

        Reserva reserva = s.getReserva();
        boolean reservaAguardando = reserva != null && "AGUARDANDO_TRANSFERENCIA".equals(reserva.getStatus());

        if (danificado) {
            exemplar.setEstadoConservacao("DANIFICADO");
            estadoExemplar.mudarStatus(exemplar, StatusExemplar.INDISPONIVEL, // T13
                chegada + " O exemplar chegou danificado e saiu de circulação"
                + (observacao != null && !observacao.isBlank() ? ": " + observacao.trim() : "") + ".");
            if (reservaAguardando) {
                reserva.setStatus("PENDENTE");            // dataReserva intacta: mesma posição
                reserva.setExemplar(null);
                reserva.setBibliotecaDestino(reserva.getBibliotecaFila()); // retirada na origem
                reservaRepository.save(reserva);
                notificacoes.reservaVoltouParaFila(reserva,
                    "O exemplar que vinha para você chegou danificado à " + s.getBibliotecaDestino().getNome() + ".");
            }
        } else if (reservaAguardando) {
            estadoExemplar.mudarStatus(exemplar, StatusExemplar.RESERVADO, chegada); // T10
            filaEsperaService.liberarParaRetirada(reserva, exemplar);
        } else {
            filaEsperaService.liberar(exemplar, chegada); // T11, ou T10 para o 1º da fila do destino
        }

        estadoExemplar.sincronizarMarcaDeFila(exemplar.getLivro(), s.getBibliotecaDestino());
        estadoExemplar.sincronizarMarcaDeFila(exemplar.getLivro(), origem);

        log.info("[BLACKBOARD] Transferência #" + id + " concluída"
            + (danificado ? " (chegou danificado)" : "") + ". Exemplar agora em "
            + s.getBibliotecaDestino().getNome());
        return s;
    }

    public boolean ehBibliotecarioDoDestino(Usuario u, SolicitacaoTransferencia s) {
        return "BIBLIOTECARIO".equals(u.getTipo()) && u.getBiblioteca() != null
            && u.getBiblioteca().getId().equals(s.getBibliotecaDestino().getId());
    }

    /**
     * Chamado quando a reserva é cancelada: pedidos ainda não despachados são cancelados.
     * Pedido EM_TRANSITO não é tocado: o exemplar chega ao destino como DISPONIVEL.
     */
    @Transactional
    public void cancelarPorReserva(Reserva reserva) {
        List<SolicitacaoTransferencia> abertas = transferenciaRepository
            .findByReservaAndStatusIn(reserva, List.of("PENDENTE", "APROVADA"));

        for (SolicitacaoTransferencia s : abertas) {
            s.setStatus("CANCELADA");
            s.setDataConclusao(LocalDateTime.now());
            s.setObservacoes("Cancelada: o usuário cancelou a reserva.");
            transferenciaRepository.save(s);
        }
    }

    // ───────────────────────── Apoio ─────────────────────────

    private SolicitacaoTransferencia buscarPendente(Long id) {
        SolicitacaoTransferencia s = buscar(id);
        if (!"PENDENTE".equals(s.getStatus())) {
            throw new RuntimeException("Esta solicitação já foi processada (status: "
                + s.getStatus() + ").");
        }
        return s;
    }

    /** RN04 — a decisão é exclusiva do Admin da rede. */
    private Usuario validarAdmin(Long adminId) {
        Usuario admin = usuarioRepository.findById(adminId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: ID " + adminId));
        if (!"ADMIN".equals(admin.getTipo())) {
            throw new RuntimeException("Apenas o Administrador da Rede pode realizar esta ação.");
        }
        return admin;
    }

    private static String etapa(SolicitacaoTransferencia s) {
        return "APROVADA".equals(s.getStatus()) && s.getExemplar() == null
            ? "APROVADA_AGUARDANDO_EXEMPLAR" : s.getStatus();
    }

    private Transferencia paraResumo(SolicitacaoTransferencia s) {
        Reserva r = s.getReserva();
        boolean reservaAtiva = r != null && RESERVA_ATIVA.contains(r.getStatus());
        return new Transferencia(s.getId(), r != null ? "RESERVA" : "AVULSA", s.getStatus(), etapa(s),
            s.getLivro().getId(), s.getLivro().getTitulo(),
            s.getExemplar() != null ? s.getExemplar().getId() : null,
            ref(s.getBibliotecaOrigem()), ref(s.getBibliotecaDestino()),
            ref(s.getSolicitante()), ref(s.getAprovador()),
            r != null ? r.getId() : null,
            reservaAtiva ? r.getUsuario().getNome() : null,
            r != null ? r.getStatus() : null,
            s.getDataSolicitacao(), s.getDataConclusao(), s.getObservacoes());
    }

    private static Ref ref(Biblioteca b) {
        return b == null ? null : new Ref(b.getId(), b.getNome());
    }

    private static Ref ref(Usuario u) {
        return u == null ? null : new Ref(u.getId(), u.getNome());
    }
}
