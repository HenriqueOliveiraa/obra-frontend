export interface DiaTrabalho {
  id?: number;
  data: string;
  trabalhou: boolean;
  observacao?: string;
}

export type Categoria = 'MATERIAL' | 'MAO_DE_OBRA' | 'TRANSPORTE' | 'OUTROS';

export type StatusMaterial = 'RETIRADO' | 'A_CAMINHO' | 'ENTREGUE';

export type EtapaObra = 'FUNDACAO' | 'ALVENARIA' | 'ELETRICA_HIDRAULICA' | 'ACABAMENTO';

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
  statusMaterial?: StatusMaterial;
  responsavelRecebimento?: string;
  etapa?: EtapaObra;
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

export interface OrcamentoConfig {
  orcamentoTotal: number;
  tetoPorCategoria: Record<Categoria, number>;
  margemtolerancia: number;
}

export type CategoriaOrcamento =
  | 'FUNDACAO'
  | 'ESTRUTURA'
  | 'ALVENARIA'
  | 'COBERTURA'
  | 'ESQUADRIAS'
  | 'INSTALACOES_ELETRICAS'
  | 'INSTALACOES_HIDRAULICAS'
  | 'REVESTIMENTOS'
  | 'ACABAMENTOS'
  | 'LOUCAS_E_METAIS'
  | 'MATERIAIS_BASICOS'
  | 'IMPERMEABILIZACAO'
  | 'VIDROS'
  | 'MARCENARIA'
  | 'GESSO_E_DRYWALL'
  | 'PAISAGISMO'
  | 'MAO_DE_OBRA'
  | 'EQUIPAMENTOS_E_FERRAMENTAS'
  | 'FRETE_E_LOGISTICA'
  | 'SERVICOS_TERCEIRIZADOS';

export interface Cotacao {
  id?: number;
  categoria: CategoriaOrcamento;
  subcategoria: string;
  subcategoriaCustom?: string;
  item: string;
  fornecedor: string;
  valor: number;
  quantidade?: number;
  unidade?: string;
  data: string;
  observacao?: string;
  escolhido: boolean;
}

export interface Fornecedor {
  id?: number;
  nome: string;
  telefone?: string;
  especialidade?: string;
  observacao?: string;
}

export interface Comprovante {
  gastoId: number;
  nomeArquivo: string;
  tipoArquivo: string;
  dataUrl: string;
  dataUpload: string;
}

export type PrioridadeCompra = 'ALTA' | 'MEDIA' | 'BAIXA';

export interface ItemCompra {
  id?: number;
  descricao: string;
  categoria: Categoria;
  quantidadeDesejada?: number;
  prioridade: PrioridadeCompra;
  observacao?: string;
  comprado: boolean;
}
