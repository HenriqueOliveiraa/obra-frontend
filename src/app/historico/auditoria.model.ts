export type AcaoAuditoria = 'CRIACAO' | 'EDICAO' | 'EXCLUSAO';

export interface AuditoriaEvento {
  id: string;
  usuarioId: string;
  usuarioNome: string;

  entidade: string;
  entidadeId: string;
  entidadeDescricao?: string;

  acao: AcaoAuditoria;
  descricao: string;

  dadosAnteriores?: Record<string, unknown> | null;
  dadosNovos?: Record<string, unknown> | null;

  criadoEm: string;
}

export interface FiltroAuditoria {
  usuarioId?: string;
  entidade?: string;
  acao?: AcaoAuditoria;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
  pagina: number;
  tamanhoPagina: number;
}

export interface RespostaPaginada<T> {
  itens: T[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
}

export interface UsuarioResumo {
  id: string;
  nome: string;
}

export interface EntidadeResumo {
  chave: string;
  rotulo: string;
}


