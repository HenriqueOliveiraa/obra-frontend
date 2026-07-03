import { CategoriaOrcamento } from './models';

export const CATEGORIAS_ORCAMENTO: CategoriaOrcamento[] = [
  'FUNDACAO', 'ESTRUTURA', 'ALVENARIA', 'COBERTURA', 'ESQUADRIAS',
  'INSTALACOES_ELETRICAS', 'INSTALACOES_HIDRAULICAS', 'REVESTIMENTOS', 'ACABAMENTOS',
  'LOUCAS_E_METAIS', 'MATERIAIS_BASICOS', 'IMPERMEABILIZACAO', 'VIDROS',
  'MARCENARIA', 'GESSO_E_DRYWALL', 'PAISAGISMO', 'MAO_DE_OBRA',
  'EQUIPAMENTOS_E_FERRAMENTAS', 'FRETE_E_LOGISTICA', 'SERVICOS_TERCEIRIZADOS'
];

export const CATEGORIA_ORCAMENTO_LABEL: Record<CategoriaOrcamento, string> = {
  FUNDACAO: 'Fundação',
  ESTRUTURA: 'Estrutura',
  ALVENARIA: 'Alvenaria',
  COBERTURA: 'Cobertura',
  ESQUADRIAS: 'Esquadrias',
  INSTALACOES_ELETRICAS: 'Instalações elétricas',
  INSTALACOES_HIDRAULICAS: 'Instalações hidráulicas',
  REVESTIMENTOS: 'Revestimentos',
  ACABAMENTOS: 'Acabamentos',
  LOUCAS_E_METAIS: 'Louças e metais',
  MATERIAIS_BASICOS: 'Materiais básicos',
  IMPERMEABILIZACAO: 'Impermeabilização',
  VIDROS: 'Vidros',
  MARCENARIA: 'Marcenaria',
  GESSO_E_DRYWALL: 'Gesso e Drywall',
  PAISAGISMO: 'Paisagismo',
  MAO_DE_OBRA: 'Mão de obra',
  EQUIPAMENTOS_E_FERRAMENTAS: 'Equipamentos e ferramentas',
  FRETE_E_LOGISTICA: 'Frete e logística',
  SERVICOS_TERCEIRIZADOS: 'Serviços terceirizados'
};

export const CATEGORIA_ORCAMENTO_CLASSE: Record<CategoriaOrcamento, string> = {
  FUNDACAO: 'cat-fundacao',
  ESTRUTURA: 'cat-estrutura',
  ALVENARIA: 'cat-alvenaria',
  COBERTURA: 'cat-cobertura',
  ESQUADRIAS: 'cat-esquadrias',
  INSTALACOES_ELETRICAS: 'cat-eletrica',
  INSTALACOES_HIDRAULICAS: 'cat-hidraulica',
  REVESTIMENTOS: 'cat-revestimentos',
  ACABAMENTOS: 'cat-acabamentos',
  LOUCAS_E_METAIS: 'cat-loucas-metais',
  MATERIAIS_BASICOS: 'cat-materiais-basicos',
  IMPERMEABILIZACAO: 'cat-impermeabilizacao',
  VIDROS: 'cat-vidros',
  MARCENARIA: 'cat-marcenaria',
  GESSO_E_DRYWALL: 'cat-gesso-drywall',
  PAISAGISMO: 'cat-paisagismo',
  MAO_DE_OBRA: 'cat-mao-de-obra',
  EQUIPAMENTOS_E_FERRAMENTAS: 'cat-equipamentos',
  FRETE_E_LOGISTICA: 'cat-frete',
  SERVICOS_TERCEIRIZADOS: 'cat-servicos-terceirizados'
};

export const SUBCATEGORIAS_POR_CATEGORIA: Record<CategoriaOrcamento, string[]> = {
  FUNDACAO: ['Estacas', 'Sapatas', 'Blocos', 'Concreto', 'Ferragens'],
  ESTRUTURA: ['Vigas', 'Pilares', 'Lajes', 'Aço', 'Concreto'],
  ALVENARIA: ['Tijolos', 'Blocos', 'Argamassa de assentamento'],
  COBERTURA: ['Telhas', 'Madeiramento', 'Calhas', 'Rufos'],
  ESQUADRIAS: ['Portas', 'Janelas', 'Portões', 'Venezianas', 'Batentes'],
  INSTALACOES_ELETRICAS: ['Fios', 'Cabos', 'Disjuntores', 'Tomadas', 'Interruptores'],
  INSTALACOES_HIDRAULICAS: ['Tubos', 'Conexões', 'Registros', 'Caixas d\'água'],
  REVESTIMENTOS: ['Pisos', 'Porcelanatos', 'Azulejos', 'Laminados'],
  ACABAMENTOS: ['Pintura', 'Massa corrida', 'Rodapés', 'Molduras'],
  LOUCAS_E_METAIS: ['Vasos sanitários', 'Torneiras', 'Chuveiros', 'Cubas'],
  MATERIAIS_BASICOS: ['Areia', 'Cimento', 'Brita', 'Cal', 'Argamassa', 'Pedra'],
  IMPERMEABILIZACAO: ['Mantas', 'Impermeabilizantes', 'Selantes'],
  VIDROS: ['Vidros temperados', 'Espelhos', 'Box'],
  MARCENARIA: ['Móveis planejados', 'Bancadas', 'Armários'],
  GESSO_E_DRYWALL: ['Forros', 'Divisórias', 'Sancas'],
  PAISAGISMO: ['Grama', 'Plantas', 'Irrigação'],
  MAO_DE_OBRA: ['Pedreiro', 'Eletricista', 'Encanador', 'Pintor'],
  EQUIPAMENTOS_E_FERRAMENTAS: ['Andaimes', 'Betoneira', 'Aluguel de máquinas'],
  FRETE_E_LOGISTICA: ['Transporte de materiais', 'Caçambas'],
  SERVICOS_TERCEIRIZADOS: ['Topografia', 'Sondagem', 'Projetos', 'Limpeza']
};

export const SUBCATEGORIA_OUTRO = 'OUTRO';
