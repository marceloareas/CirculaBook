package com.circulabook.dto;

/**
 * Alimenta a coluna de alertas da Tela 4 (RN01 e RN12):
 * diz se o usuário está apto a pegar mais um livro emprestado.
 */
public class SituacaoUsuarioDTO {

    private Long usuarioId;
    private String nome;
    private String email;
    private int emprestimosAtivos;
    private int limite;
    private boolean bloqueado;
    private String bloqueadoAte;
    private boolean apto;
    private String motivo;

    public SituacaoUsuarioDTO() {}

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public int getEmprestimosAtivos() { return emprestimosAtivos; }
    public void setEmprestimosAtivos(int v) { this.emprestimosAtivos = v; }

    public int getLimite() { return limite; }
    public void setLimite(int limite) { this.limite = limite; }

    public boolean isBloqueado() { return bloqueado; }
    public void setBloqueado(boolean bloqueado) { this.bloqueado = bloqueado; }

    public String getBloqueadoAte() { return bloqueadoAte; }
    public void setBloqueadoAte(String bloqueadoAte) { this.bloqueadoAte = bloqueadoAte; }

    public boolean isApto() { return apto; }
    public void setApto(boolean apto) { this.apto = apto; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}
