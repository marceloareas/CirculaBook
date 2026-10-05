package com.circulabook.model;

import java.util.Map;
import java.util.Set;

/**
 * Estados do exemplar e a tabela de transições válidas.
 * Os status continuam sendo String (convenção do projeto); aqui ficam as
 * constantes e a única definição de quais mudanças são permitidas.
 */
public final class StatusExemplar {

    public static final String DISPONIVEL = "DISPONIVEL";
    public static final String EMPRESTADO = "EMPRESTADO";
    /** Emprestado e há fila PENDENTE do título nesta biblioteca. */
    public static final String EMPRESTADO_RESERVADO = "EMPRESTADO_RESERVADO";
    /** Separado para o 1º da fila, aguardando retirada. */
    public static final String RESERVADO = "RESERVADO";

    private StatusExemplar() {}

    /** Origem -> destinos permitidos. */
    private static final Map<String, Set<String>> TRANSICOES = Map.of(
        DISPONIVEL, Set.of(
            EMPRESTADO),            // empréstimo
        EMPRESTADO, Set.of(
            DISPONIVEL,             // devolução, fila vazia
            EMPRESTADO_RESERVADO),  // alguém entrou na fila
        EMPRESTADO_RESERVADO, Set.of(
            RESERVADO,              // devolução: separado para o 1º da fila
            EMPRESTADO),            // a fila esvaziou
        RESERVADO, Set.of(
            EMPRESTADO_RESERVADO,   // retirada e ainda há fila
            EMPRESTADO,             // retirada e não há mais fila
            DISPONIVEL,             // expiração/cancelamento com fila vazia
            RESERVADO)              // expiração/cancelamento com fila: passa ao próximo
    );

    public static boolean transicaoValida(String de, String para) {
        if (de == null || para == null) return false;
        return TRANSICOES.getOrDefault(de, Set.of()).contains(para);
    }

    public static boolean emprestado(String status) {
        return EMPRESTADO.equals(status) || EMPRESTADO_RESERVADO.equals(status);
    }

    /** Nome legível para mensagens ao usuário. */
    public static String rotulo(String status) {
        if (status == null) return "(sem situação)";
        return switch (status) {
            case DISPONIVEL -> "Disponível";
            case EMPRESTADO -> "Emprestado";
            case EMPRESTADO_RESERVADO -> "Emprestado (com fila)";
            case RESERVADO -> "Reservado";
            default -> status;
        };
    }
}
