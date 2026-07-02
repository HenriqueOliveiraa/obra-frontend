export interface DiaTrabalho {
  id?: number;
  data: string;
  trabalhou: boolean;
  observacao?: string;
}

export type Categoria = 'MATERIAL' | 'MAO_DE_OBRA' | 'TRANSPORTE' | 'OUTROS';

export interface Parcela {
  id: number;
  numero: number;
  valor: number;
  vencimento: string;
  pago: boolean;
  dataPagamento?: string;
}

export interface Gasto {
  id?: number;
  descricao: string;
  categoria: Categoria;
  quantidade: number;
  valorTotal: number;
  parcelado: boolean;
  numeroParcelas?: number;
  diaVencimento?: number;
  dataCompra: string;
  fornecedor?: string;
  parcelas?: Parcela[];
}

export interface ResumoGastos {
  totalGasto: number;
  totalPago: number;
  totalPendente: number;
  parcelasPagas: number;
  parcelasPendentes: number;
}

export interface Pagina<T> {
  content: T[];
}

export interface ItemAgregado {
  descricao: string;
  quantidadeTotal: number;
  valorTotalGasto: number;
}

export interface CategoriaGastoTotal {
  categoria: Categoria;
  totalGasto: number;
}

export interface Dashboard {
  materiaisMaisComprados: ItemAgregado[];
  gastoPorCategoria: CategoriaGastoTotal[];
}
