import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * ============================================================================
 * PDF RELATÓRIO SERVICE
 * ============================================================================
 *
 * Serviço central de geração de PDFs do sistema "Controle de Obra".
 *
 * Objetivo: centralizar TODA a lógica de layout, tipografia, cores, margens,
 * cabeçalho, rodapé, paginação e tabelas usada nos relatórios exportados
 * (Gastos, Financeiro, Orçamentos e quaisquer telas futuras).
 *
 * As páginas do sistema (componentes Angular) NUNCA devem manipular jsPDF
 * diretamente. Elas apenas chamam `PdfRelatorioService.iniciar(...)` e usam
 * os métodos encadeáveis do builder retornado para descrever o CONTEÚDO do
 * relatório (títulos de seção, cards de resumo, tabelas, imagens). Todo o
 * resto — aparência, margens, quebra de página, numeração — é resolvido
 * aqui, uma única vez, de forma consistente.
 *
 * Uso típico em um componente:
 *
 *   this.pdfService.carregarLogo().then(logo => {
 *     const pdf = this.pdfService.iniciar('Relatório de Gastos', logo);
 *     pdf.resumoCards([
 *       { label: 'Total gasto', valor: 'R$ 12.345,00' },
 *       { label: 'Total pago', valor: 'R$ 8.000,00', corValor: '#16a34a' },
 *     ]);
 *     pdf.tituloSecao('Gastos lançados');
 *     pdf.tabela({
 *       colunas: [
 *         { chave: 'descricao', titulo: 'Descrição' },
 *         { chave: 'valor', titulo: 'Valor', monetario: true }
 *       ],
 *       linhas: gastos.map(g => ({ descricao: g.descricao, valor: g.valorTotal }))
 *     });
 *     pdf.salvar('relatorio-gastos.pdf');
 *   });
 * ============================================================================
 */

/** Card de resumo exibido no topo do relatório (ex.: "Total gasto: R$ 12.345,00"). */
export interface ResumoCardPdf {
  label: string;
  valor: string;
  /** Cor hexadecimal opcional para destacar o valor (ex.: verde para "pago", vermelho para "pendente"). */
  corValor?: string;
}

/** Definição de uma coluna de tabela do relatório. */
export interface ColunaTabelaPdf {
  /** Chave usada para buscar o valor dentro de cada objeto de `linhas`. */
  chave: string;
  /** Texto exibido no cabeçalho da coluna. */
  titulo: string;
  /** Largura fixa em mm. Se omitido, a largura é calculada automaticamente. */
  largura?: number;
  /** Alinhamento do conteúdo. Padrão: 'right' para colunas monetárias, 'left' para as demais. */
  alinhamento?: 'left' | 'center' | 'right';
  /** Se true, formata o valor numérico da célula como moeda brasileira (R$ 0.000,00). */
  monetario?: boolean;
}

/** Resultado de destaque aplicado a uma linha inteira da tabela. */
export interface DestaqueLinhaPdf {
  /** Cor de fundo hexadecimal da linha. */
  cor?: string;
  /** Cor do texto hexadecimal da linha. */
  corTexto?: string;
}

/** Opções para renderização de uma tabela dentro do relatório. */
export interface TabelaPdfOpcoes {
  colunas: ColunaTabelaPdf[];
  linhas: Record<string, string | number | null | undefined>[];
  /**
   * Permite destacar visualmente linhas específicas (ex.: cotação escolhida,
   * cotação mais barata, gasto pendente). Recebe a linha original (o mesmo
   * objeto passado em `linhas`) e o índice, e deve retornar as cores de
   * destaque ou `null`/`undefined` para não destacar.
   */
  destacarLinha?: (linha: Record<string, string | number | null | undefined>, indice: number) => DestaqueLinhaPdf | null | undefined;
}

/** Paleta de cores do sistema, replicada aqui a partir das variáveis de `styles.css`. */
const CORES = {
  ink: '#111827',
  muted: '#9ca3af',
  accent: '#f59e0b',
  accentHover: '#d97706',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#b45309',
  border: '#e5e7eb',
  bgClaro: '#f9fafb',
  branco: '#ffffff',
  bannerEscuro: '#1C1C1C',
  tabelaHeader: '#e8a33d'
};

/** Layout fixo da página A4, em milímetros. */
const LARGURA_A4 = 210;
const ALTURA_A4 = 297;
const MARGEM = 14;
const ALTURA_RODAPE = 16;
const NOME_MARCA = 'CONTROLE DE OBRA';
const ALTURA_BANNER_MM = 46;
const ALTURA_LOGO_BADGE_MM = 48;
const ALTURA_BLOCO_TEXTO_MM = 24;

/**
 * Margem direita do badge do logo, em mm, medida a partir da borda direita
 * da página — por padrão igual a `MARGEM`, a mesma margem usada pelo texto
 * do lado esquerdo, para as duas laterais ficarem simétricas.
 *
 * PARA AJUSTAR A POSIÇÃO HORIZONTAL DO LOGO MANUALMENTE:
 * - DIMINUA este número para mover o logo mais para a DIREITA (mais perto da borda da página).
 * - AUMENTE este número para mover o logo mais para a ESQUERDA (mais afastado da borda).
 */
const MARGEM_LOGO_MM = 2;

/**
 * Deslocamento vertical manual do logo, em mm, aplicado por cima da posição
 * centralizada automática dentro do banner. Com valor 0, o logo fica
 * perfeitamente centralizado na vertical.
 *
 * PARA AJUSTAR A POSIÇÃO VERTICAL DO LOGO MANUALMENTE:
 * - AUMENTE este número para mover o logo mais para BAIXO.
 * - DIMINUA (ou use negativo) para mover o logo mais para CIMA.
 */
const DESLOCAMENTO_VERTICAL_LOGO_MM = 1;

/** Resultado do carregamento do logo institucional, pronto para uso no jsPDF. */
export interface LogoCarregado {
  dataUrl: string;
  larguraPx: number;
  alturaPx: number;
}

/** Converte uma cor hexadecimal (#rrggbb) em uma tupla RGB (0-255, 0-255, 0-255). */
function hexParaRgb(hex: string): [number, number, number] {
  const normalizado = hex.replace('#', '');
  const bigint = parseInt(normalizado, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

/** Formata um valor numérico como moeda brasileira, ex.: 1234.5 -> "R$ 1.234,50". */
export function formatarMoedaPdf(valor: number | null | undefined): string {
  const numero = typeof valor === 'number' && !isNaN(valor) ? valor : 0;
  return `R$ ${numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Formata uma data no padrão brasileiro (dd/MM/yyyy) a partir de uma string ISO (yyyy-MM-dd). */
export function formatarDataPdf(dataIso: string | null | undefined): string {
  if (!dataIso) { return '—'; }
  const partes = dataIso.split('T')[0].split('-');
  if (partes.length !== 3) { return dataIso; }
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

/** Retorna a data e hora atuais formatadas no padrão brasileiro, ex.: "06/07/2026 às 14:32". */
function formatarDataHoraAtual(): string {
  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR');
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} às ${hora}`;
}

/**
 * Builder encadeável responsável por montar um relatório em PDF.
 * Uma instância é criada a cada chamada de `PdfRelatorioService.iniciar(...)`
 * e mantém internamente o documento jsPDF e a posição vertical atual
 * (cursor), avançando automaticamente para uma nova página quando o
 * conteúdo não couber no espaço restante.
 */
export class PdfRelatorioBuilder {
  private readonly doc: jsPDF;
  private cursorY: number;

  constructor(
    private readonly nomeRelatorio: string,
    private readonly logo: LogoCarregado | null = null,
    private readonly metadadosExtras: string[] = []
  ) {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.cursorY = MARGEM;
    this.desenharCabecalho();
  }

  /**
   * Desenha o cabeçalho institucional como um banner de largura total no
   * topo da primeira página: fundo escuro, título em branco, marca em
   * branco, metadados em cinza claro (para não ficar tudo branco), e um
   * badge do logo no canto superior direito.
   */
  private desenharCabecalho(): void {
    const doc = this.doc;

    const [bannerR, bannerG, bannerB] = hexParaRgb(CORES.bannerEscuro);
    doc.setFillColor(bannerR, bannerG, bannerB);
    doc.rect(0, 0, LARGURA_A4, ALTURA_BANNER_MM, 'F');

    const corTitulo: [number, number, number] = [255, 255, 255];
    const corSubtitulo: [number, number, number] = [255, 255, 255];
    const corMetadados: [number, number, number] = hexParaRgb(CORES.muted);

    if (this.logo) {
      const alturaLogo = ALTURA_LOGO_BADGE_MM;
      const larguraLogo = (this.logo.larguraPx / this.logo.alturaPx) * alturaLogo;
      const xLogo = LARGURA_A4 - MARGEM_LOGO_MM - larguraLogo;
      const yLogo = (ALTURA_BANNER_MM - alturaLogo) / 2 + DESLOCAMENTO_VERTICAL_LOGO_MM;
      doc.addImage(this.logo.dataUrl, 'PNG', xLogo, yLogo, larguraLogo, alturaLogo);
    }

    const topoBlocoTexto = (ALTURA_BANNER_MM - ALTURA_BLOCO_TEXTO_MM) / 2;
    const yTitulo = topoBlocoTexto + 8;
    const ySubtitulo = yTitulo + 7;
    const yMetadados = ySubtitulo + 9;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...corTitulo);
    doc.text(this.nomeRelatorio, MARGEM, yTitulo);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...corSubtitulo);
    doc.text(`${NOME_MARCA} · Relatório Gerencial`, MARGEM, ySubtitulo);

    const metadados = [`Gerado em ${formatarDataHoraAtual()}`, ...this.metadadosExtras];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let xCursor = MARGEM;
    metadados.forEach((texto, indice) => {
      if (indice > 0) {
        doc.setTextColor(...corMetadados);
        doc.text('•', xCursor, yMetadados);
        xCursor += doc.getTextWidth('•') + 3;
      }
      doc.setTextColor(...corMetadados);
      doc.text(texto, xCursor, yMetadados);
      xCursor += doc.getTextWidth(texto) + 6;
    });

    this.cursorY = ALTURA_BANNER_MM + 10;
  }

  /**
   * Garante que existe espaço vertical suficiente para o próximo bloco de
   * conteúdo. Se não houver, cria uma nova página e reposiciona o cursor.
   */
  private garantirEspaco(alturaNecessaria: number): void {
    const limiteInferior = ALTURA_A4 - MARGEM - ALTURA_RODAPE;
    if (this.cursorY + alturaNecessaria > limiteInferior) {
      this.doc.addPage();
      this.cursorY = MARGEM;
    }
  }

  /** Adiciona um título de seção (ex.: "Gastos lançados", "Resumo por categoria"). */
  tituloSecao(texto: string): this {
    this.garantirEspaco(12);

    const doc = this.doc;
    const [accentR, accentG, accentB] = hexParaRgb(CORES.accent);
    const [inkR, inkG, inkB] = hexParaRgb(CORES.ink);

    doc.setFillColor(accentR, accentG, accentB);
    doc.rect(MARGEM, this.cursorY - 3.4, 1.3, 4.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(inkR, inkG, inkB);
    doc.text(texto, MARGEM + 5, this.cursorY);

    this.cursorY += 8;
    return this;
  }

  /** Adiciona um subtítulo leve, usado para identificar subgrupos dentro de uma seção. */
  subtitulo(texto: string): this {
    this.garantirEspaco(8);

    const doc = this.doc;
    const [inkR, inkG, inkB] = hexParaRgb(CORES.ink);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(inkR, inkG, inkB);
    doc.text(texto, MARGEM, this.cursorY);

    this.cursorY += 6;
    return this;
  }

  /**
   * Adiciona uma linha de cards de resumo (até 4 por linha, quebrando
   * automaticamente para novas linhas se houver mais).
   */
  resumoCards(cards: ResumoCardPdf[]): this {
    if (cards.length === 0) { return this; }

    const doc = this.doc;
    const espacoDisponivel = LARGURA_A4 - MARGEM * 2;
    const colunas = Math.min(cards.length, 4);
    const gap = 4;
    const largura = (espacoDisponivel - gap * (colunas - 1)) / colunas;
    const alturaCard = 20;
    const totalLinhas = Math.ceil(cards.length / colunas);

    this.garantirEspaco(alturaCard);

    const [borderR, borderG, borderB] = hexParaRgb(CORES.border);
    const [mutedR, mutedG, mutedB] = hexParaRgb(CORES.muted);
    const [inkR, inkG, inkB] = hexParaRgb(CORES.ink);

    cards.forEach((card, indice) => {
      const linha = Math.floor(indice / colunas);
      const coluna = indice % colunas;

      if (coluna === 0 && linha > 0) {
        this.garantirEspaco(alturaCard + gap);
      }

      const x = MARGEM + coluna * (largura + gap);
      const y = this.cursorY + linha * (alturaCard + gap);

      doc.setDrawColor(borderR, borderG, borderB);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, largura, alturaCard, 1.6, 1.6, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.6);
      doc.setTextColor(mutedR, mutedG, mutedB);
      doc.text(card.label.toUpperCase(), x + 4, y + 7);

      const [corR, corG, corB] = card.corValor ? hexParaRgb(card.corValor) : [inkR, inkG, inkB];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(corR, corG, corB);
      doc.text(card.valor, x + 4, y + 15.5);
    });

    this.cursorY += totalLinhas * alturaCard + (totalLinhas - 1) * gap + 8;
    return this;
  }

  /** Adiciona uma tabela com quebra automática de página e destaque opcional de linhas. */
  tabela(opcoes: TabelaPdfOpcoes): this {
    const doc = this.doc;
    const [inkR, inkG, inkB] = hexParaRgb(CORES.ink);
    const [borderR, borderG, borderB] = hexParaRgb(CORES.border);
    const [bgR, bgG, bgB] = hexParaRgb(CORES.bgClaro);
    const [headerR, headerG, headerB] = hexParaRgb(CORES.tabelaHeader);

    const colunas = opcoes.colunas;
    const cabecalho = [colunas.map(coluna => coluna.titulo)];

    const corpo = opcoes.linhas.map(linha =>
      colunas.map(coluna => {
        const valor = linha[coluna.chave];
        if (valor === null || valor === undefined || valor === '') { return '—'; }
        if (coluna.monetario && typeof valor === 'number') { return formatarMoedaPdf(valor); }
        return String(valor);
      })
    );

    const columnStyles: Record<number, { halign: 'left' | 'center' | 'right'; cellWidth: number | 'auto' }> = {};
    colunas.forEach((coluna, indice) => {
      columnStyles[indice] = {
        halign: coluna.alinhamento ?? (coluna.monetario ? 'right' : 'left'),
        cellWidth: coluna.largura ?? 'auto'
      };
    });

    autoTable(doc, {
      startY: this.cursorY,
      margin: { left: MARGEM, right: MARGEM, bottom: ALTURA_RODAPE + 6, top: MARGEM },
      head: cabecalho,
      body: corpo,
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.6,
        textColor: [inkR, inkG, inkB],
        lineColor: [borderR, borderG, borderB],
        lineWidth: 0.15,
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [headerR, headerG, headerB],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.6,
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [bgR, bgG, bgB]
      },
      columnStyles,
      didParseCell: dados => {
        if (dados.section !== 'body') { return; }
        const linhaOriginal = opcoes.linhas[dados.row.index];
        const destaque = opcoes.destacarLinha?.(linhaOriginal, dados.row.index);
        if (destaque?.cor) {
          const [r, g, b] = hexParaRgb(destaque.cor);
          dados.cell.styles.fillColor = [r, g, b];
        }
        if (destaque?.corTexto) {
          const [r, g, b] = hexParaRgb(destaque.corTexto);
          dados.cell.styles.textColor = [r, g, b];
        }
      }
    });

    this.cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    return this;
  }

  /** Adiciona um texto simples em itálico (ex.: legendas, observações). */
  textoDestaque(texto: string, cor: string = CORES.muted): this {
    this.garantirEspaco(8);

    const [r, g, b] = hexParaRgb(cor);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(8.2);
    this.doc.setTextColor(r, g, b);
    this.doc.text(texto, MARGEM, this.cursorY);

    this.cursorY += 7;
    return this;
  }

  /** Insere uma imagem (ex.: gráfico exportado como PNG via canvas.toDataURL). */
  imagem(dataUrlPng: string, larguraMm: number, alturaMm: number): this {
    this.garantirEspaco(alturaMm + 4);
    this.doc.addImage(dataUrlPng, 'PNG', MARGEM, this.cursorY, larguraMm, alturaMm);
    this.cursorY += alturaMm + 8;
    return this;
  }

  /** Adiciona um espaçamento vertical manual entre blocos de conteúdo. */
  espacamento(mm: number = 4): this {
    this.cursorY += mm;
    return this;
  }

  /**
   * Finaliza o relatório: carimba o rodapé ("Página X de Y" + assinatura do
   * sistema) em TODAS as páginas geradas e então salva o arquivo.
   */
  salvar(nomeArquivo: string): void {
    this.finalizarRodapes();
    this.doc.save(nomeArquivo);
  }

  private finalizarRodapes(): void {
    const doc = this.doc;
    const totalPaginas = doc.getNumberOfPages();
    const [borderR, borderG, borderB] = hexParaRgb(CORES.border);
    const yLinha = ALTURA_A4 - ALTURA_RODAPE;

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      doc.setPage(pagina);

      doc.setDrawColor(borderR, borderG, borderB);
      doc.setLineWidth(0.3);
      doc.line(MARGEM, yLinha, LARGURA_A4 - MARGEM, yLinha);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.6);
      doc.setTextColor(107, 114, 128);

      doc.text('Gerado automaticamente pelo sistema.', MARGEM, yLinha + 6);

      const textoPagina = `Página ${pagina} de ${totalPaginas}`;
      const larguraTexto = doc.getTextWidth(textoPagina);
      doc.text(textoPagina, LARGURA_A4 - MARGEM - larguraTexto, yLinha + 6);
    }
  }
}

/**
 * Ponto de entrada único para geração de relatórios em PDF.
 * Injetável em qualquer componente standalone via `inject(PdfRelatorioService)`.
 */
@Injectable({ providedIn: 'root' })
export class PdfRelatorioService {
  /**
   * Cache do logo já carregado e convertido para base64, para não
   * recarregar o arquivo a cada exportação.
   */
  private logoCache: Promise<LogoCarregado | null> | null = null;

  /**
   * Carrega o logo institucional (por padrão, `/logo.png`, servido a partir
   * da pasta `public/` do projeto Angular) e o converte para base64, para
   * que possa ser embutido diretamente no PDF. O resultado fica em cache:
   * chamadas seguintes retornam a mesma Promise já resolvida.
   *
   * Se o arquivo não existir ou falhar ao carregar, resolve com `null` —
   * o relatório é gerado normalmente, apenas sem o logo.
   */
  carregarLogo(caminho: string = '/logo.png'): Promise<LogoCarregado | null> {
    if (!this.logoCache) {
      this.logoCache = new Promise<LogoCarregado | null>(resolve => {
        const imagem = new Image();

        imagem.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = imagem.naturalWidth;
            canvas.height = imagem.naturalHeight;

            const contexto = canvas.getContext('2d');
            if (!contexto) { resolve(null); return; }

            contexto.drawImage(imagem, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');

            resolve({
              dataUrl,
              larguraPx: imagem.naturalWidth,
              alturaPx: imagem.naturalHeight
            });
          } catch {
            resolve(null);
          }
        };

        imagem.onerror = () => resolve(null);
        imagem.src = caminho;
      });
    }

    return this.logoCache;
  }

  /**
   * Inicia um novo relatório com o cabeçalho já desenhado.
   * @param nomeRelatorio Título exibido no cabeçalho (ex.: "Relatório de Gastos").
   * @param logo Logo já carregado via `carregarLogo()`, ou `null` para omiti-lo.
   * @param metadadosExtras Itens extras exibidos na linha de metadados do
   * banner, depois de "Gerado em ..." (ex.: `['Período: Julho/2026', '11 gastos']`).
   */
  iniciar(nomeRelatorio: string, logo: LogoCarregado | null = null, metadadosExtras: string[] = []): PdfRelatorioBuilder {
    return new PdfRelatorioBuilder(nomeRelatorio, logo, metadadosExtras);
  }
}
