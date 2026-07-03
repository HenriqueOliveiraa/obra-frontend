import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GastoService } from '../core/gasto.service';
import { OrcamentoService } from '../core/orcamento.service';
import { Categoria, Dashboard, Gasto, OrcamentoConfig, ResumoGastos } from '../core/models';

const CATEGORIA_LABEL: Record<Categoria, string> = {
  MATERIAL: 'Material',
  MAO_DE_OBRA: 'Mão de obra',
  TRANSPORTE: 'Transporte',
  OUTROS: 'Outros'
};

const CATEGORIA_COR: Record<Categoria, string> = {
  MATERIAL: '#f59e0b',
  MAO_DE_OBRA: '#3b82f6',
  TRANSPORTE: '#10b981',
  OUTROS: '#8b5cf6'
};

const CATEGORIAS: Categoria[] = ['MATERIAL', 'MAO_DE_OBRA', 'TRANSPORTE', 'OUTROS'];

const MESES_LABEL = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez'
];

interface GastoMes {
  chave: string;
  label: string;
  total: number;
}

interface LinhaCategoria {
  categoria: Categoria;
  label: string;
  cor: string;
  gasto: number;
  teto: number;
  pct: number;
  estourado: boolean;
}

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financeiro.component.html',
  styleUrl: './financeiro.component.css'
})
export class FinanceiroComponent implements OnInit {
  private gastoService = inject(GastoService);
  private orcamentoService = inject(OrcamentoService);

  config: OrcamentoConfig = {
    orcamentoTotal: 0,
    tetoPorCategoria: { MATERIAL: 0, MAO_DE_OBRA: 0, TRANSPORTE: 0, OUTROS: 0 },
    margemtolerancia: 0
  };

  form: OrcamentoConfig = this.clonarConfig(this.config);

  resumo: ResumoGastos = { totalGasto: 0, totalPago: 0, totalPendente: 0, parcelasPagas: 0, parcelasPendentes: 0 };
  dashboard: Dashboard = { materiaisMaisComprados: [], gastoPorCategoria: [] };
  gastosPorMes: GastoMes[] = [];

  mostrarForm = false;

  ngOnInit(): void {
    this.config = this.orcamentoService.obterConfig();
    this.form = this.clonarConfig(this.config);

    this.gastoService.resumo().subscribe(resumo => this.resumo = resumo);

    this.gastoService.dashboard().subscribe(dashboard => this.dashboard = dashboard);

    this.gastoService.listar().subscribe(pagina => {
      this.gastosPorMes = this.agruparPorMes(pagina.content);
    });
  }

  get pctOrcamentoTotal(): number {
    if (!this.config.orcamentoTotal) return 0;
    return Math.min(100, Math.round((this.resumo.totalGasto / this.config.orcamentoTotal) * 100));
  }

  get orcamentoTotalEstourado(): boolean {
    return this.config.orcamentoTotal > 0 && this.resumo.totalGasto > this.config.orcamentoTotal;
  }

  get saldoOrcamentoTotal(): number {
    return this.config.orcamentoTotal - this.resumo.totalGasto;
  }

  get linhasCategoria(): LinhaCategoria[] {
    return CATEGORIAS.map(categoria => {
      const gasto = this.dashboard.gastoPorCategoria.find(c => c.categoria === categoria)?.totalGasto ?? 0;
      const teto = this.config.tetoPorCategoria[categoria] ?? 0;
      const pct = teto > 0 ? Math.min(100, Math.round((gasto / teto) * 100)) : 0;

      return {
        categoria,
        label: CATEGORIA_LABEL[categoria],
        cor: CATEGORIA_COR[categoria],
        gasto,
        teto,
        pct,
        estourado: teto > 0 && gasto > teto
      };
    });
  }

  get pctMargemComprometida(): number {
    if (!this.config.margemtolerancia) return 0;
    const excedente = this.orcamentoTotalEstourado ? Math.abs(this.saldoOrcamentoTotal) : 0;
    return Math.min(100, Math.round((excedente / this.config.margemtolerancia) * 100));
  }

  private agruparPorMes(gastos: Gasto[]): GastoMes[] {
    const totais = new Map<string, number>();

    gastos.forEach(gasto => {
      const [ano, mes] = gasto.dataCompra.split('-');
      const chave = `${ano}-${mes}`;
      totais.set(chave, (totais.get(chave) ?? 0) + gasto.valorTotal);
    });

    return Array.from(totais.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([chave, total]) => {
        const mesIndex = Number(chave.split('-')[1]) - 1;
        const ano = chave.split('-')[0].slice(2);
        return { chave, label: `${MESES_LABEL[mesIndex]}/${ano}`, total };
      });
  }

  get maiorGastoMes(): number {
    return Math.max(1, ...this.gastosPorMes.map(m => m.total));
  }

  toggleForm(): void {
    this.form = this.clonarConfig(this.config);
    this.mostrarForm = !this.mostrarForm;
  }

  salvar(): void {
    this.orcamentoService.salvarConfig(this.form);
    this.config = this.clonarConfig(this.form);
    this.mostrarForm = false;
  }

  private clonarConfig(config: OrcamentoConfig): OrcamentoConfig {
    return {
      orcamentoTotal: config.orcamentoTotal,
      tetoPorCategoria: { ...config.tetoPorCategoria },
      margemtolerancia: config.margemtolerancia
    };
  }
}
