package com.circulabook.controller;

import com.circulabook.config.Ator;
import com.circulabook.dto.TransferenciaDTOs.AvulsaRequest;
import com.circulabook.dto.TransferenciaDTOs.ChegadaRequest;
import com.circulabook.model.SolicitacaoTransferencia;
import com.circulabook.service.TransferenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/transferencias")
public class TransferenciaController {

    @Autowired
    private TransferenciaService transferenciaService;

    /** Admin vê todas; o usuário comum, só as ligadas às próprias reservas. */
    @GetMapping
    public List<SolicitacaoTransferencia> obterTodas(@AuthenticationPrincipal Jwt jwt) {
        Ator ator = Ator.de(jwt);
        List<SolicitacaoTransferencia> todas = transferenciaService.obterTodas();
        if (!ator.ehComum()) return todas;
        return todas.stream()
            .filter(s -> s.getReserva() != null && s.getReserva().getUsuario() != null
                && ator.id().equals(s.getReserva().getUsuario().getId()))
            .toList();
    }

    /** A2 — pedidos PENDENTE com exemplar retido ou não e a situação da RN15 (Admin). */
    @GetMapping("/pedidos-pendentes")
    public ResponseEntity<?> pedidosPendentes() {
        return responder(transferenciaService::pedidosPendentes);
    }

    /** A2 — acompanhamento paginado (pagina começa em 0), com filtro opcional por status (Admin). */
    @GetMapping("/acompanhamento")
    public ResponseEntity<?> acompanhamento(@RequestParam(required = false) String status,
                                            @RequestParam(defaultValue = "0") int pagina,
                                            @RequestParam(defaultValue = "10") int tamanho) {
        return responder(() -> transferenciaService.acompanhamento(status, pagina, tamanho));
    }

    /** A3 — bibliotecas ativas para a avulsa, com o motivo das que não podem receber (Admin). */
    @GetMapping("/destinos-avulsa")
    public ResponseEntity<?> destinosAvulsa() {
        return responder(transferenciaService::destinosAvulsa);
    }

    /** B5 — em trânsito para a biblioteca do bibliotecário logado. */
    @GetMapping("/biblioteca/a-receber")
    public ResponseEntity<?> aReceber(@AuthenticationPrincipal Jwt jwt) {
        return responder(() -> transferenciaService.aReceber(Ator.de(jwt).bibliotecaId()));
    }

    /** B5 — saindo da biblioteca do bibliotecário logado (somente leitura). */
    @GetMapping("/biblioteca/saindo")
    public ResponseEntity<?> saindo(@AuthenticationPrincipal Jwt jwt) {
        return responder(() -> transferenciaService.saindo(Ator.de(jwt).bibliotecaId()));
    }

    /** Contadores do painel do Admin. */
    @GetMapping("/resumo")
    public Map<String, Long> obterResumo() {
        return Map.of(
            "pendentes",  transferenciaService.contarPorStatus("PENDENTE"),
            "aguardandoExemplar", transferenciaService.contarPorStatus("APROVADA"),
            "emTransito", transferenciaService.contarPorStatus("EM_TRANSITO"),
            "concluidas", transferenciaService.contarPorStatus("CONCLUIDA"),
            "rejeitadas", transferenciaService.contarPorStatus("REJEITADA")
        );
    }

    /**
     * A3 — transferência avulsa em lote (tudo ou nada): {exemplarIds, bibliotecaDestinoId, observacoes}.
     * Devolve as transferências criadas, já EM_TRANSITO.
     */
    @PostMapping("/avulsa")
    public ResponseEntity<?> criarAvulsa(@RequestBody AvulsaRequest req,
                                         @AuthenticationPrincipal Jwt jwt) {
        List<Long> ids = req.exemplarIds() != null ? req.exemplarIds()
            : req.exemplarId() != null ? List.of(req.exemplarId()) : List.of();
        return responder(() -> transferenciaService.criarAvulsas(
            ids, req.bibliotecaDestinoId(), Ator.de(jwt).id(), req.observacoes()));
    }

    /** Aprovar (somente ADMIN, RN04). */
    @PatchMapping("/{id}/aprovar")
    public ResponseEntity<?> aprovar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(transferenciaService.aprovar(id, Ator.de(jwt).id()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Rejeitar (somente ADMIN, RN04). */
    @PatchMapping("/{id}/rejeitar")
    public ResponseEntity<?> rejeitar(@PathVariable Long id,
                                      @RequestParam(required = false) String motivo,
                                      @AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(transferenciaService.rejeitar(id, Ator.de(jwt).id(), motivo));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * B5 — confirmar chegada (RN16): só o bibliotecário da biblioteca de DESTINO (outra -> 403).
     * Corpo opcional: {danificado: true, observacao} para "chegou danificado".
     */
    @PatchMapping("/{id}/confirmar-chegada")
    public ResponseEntity<?> confirmarChegada(@PathVariable Long id,
                                              @RequestBody(required = false) ChegadaRequest req,
                                              @AuthenticationPrincipal Jwt jwt) {
        Ator ator = Ator.de(jwt);
        try {
            SolicitacaoTransferencia s = transferenciaService.buscar(id);
            if (ator.bibliotecaId() == null || !ator.bibliotecaId().equals(s.getBibliotecaDestino().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Apenas um bibliotecário da "
                    + s.getBibliotecaDestino().getNome() + " pode confirmar a chegada.");
            }
            boolean danificado = req != null && Boolean.TRUE.equals(req.danificado());
            return ResponseEntity.ok(transferenciaService.confirmarChegada(
                id, ator.id(), danificado, req != null ? req.observacao() : null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private ResponseEntity<?> responder(Supplier<Object> acao) {
        try {
            return ResponseEntity.ok(acao.get());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}