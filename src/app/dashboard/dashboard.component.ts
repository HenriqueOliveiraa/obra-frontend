import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GastoService } from '../core/gasto.service';
import { Categoria, CategoriaGastoTotal, Dashboard, ResumoGastos } from '../core/models';

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

interface SegmentoDonut {
  categoria: string;
  totalGasto: number;
  cor: string;
  pct: number;
  dasharray: string;
  dashoffset: string;
}

const DONUT_R = 42;
const DONUT_C = 2 * Math.PI * DONUT_R;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private service = inject(GastoService);

  dashboard: Dashboard = { materiaisMaisComprados: [], gastoPorCategoria: [] };
  resumo: ResumoGastos = { totalGasto: 0, totalPago: 0, totalPendente: 0, parcelasPagas: 0, parcelasPendentes: 0 };
  segmentos: SegmentoDonut[] = [];

  ngOnInit(): void {
    this.service.dashboard().subscribe(dashboard => {
      this.dashboard = dashboard;
      this.segmentos = this.calcularSegmentos(dashboard.gastoPorCategoria);
    });
    this.service.resumo().subscribe(resumo => this.resumo = resumo);
  }

  categoriaLabel(categoria: Categoria): string {
    return CATEGORIA_LABEL[categoria] ?? categoria;
  }

  get itemMaisComprado() {
    return this.dashboard.materiaisMaisComprados[0];
  }

  get categoriaMaiorGasto() {
    return this.dashboard.gastoPorCategoria[0];
  }

  maiorQuantidade(): number {
    return this.dashboard.materiaisMaisComprados[0]?.quantidadeTotal ?? 1;
  }

  private calcularSegmentos(categorias: CategoriaGastoTotal[]): SegmentoDonut[] {
    const totalGeral = categorias.reduce((soma, c) => soma + c.totalGasto, 0) || 1;
    let acumulado = 0;

    return categorias.map(c => {
      const pct = (c.totalGasto / totalGeral) * 100;
      const segLen = (pct / 100) * DONUT_C;
      const dasharray = `${segLen.toFixed(2)} ${DONUT_C.toFixed(2)}`;
      const dashoffset = (DONUT_C / 4 - acumulado).toFixed(2);
      acumulado += segLen;

      return {
        categoria: this.categoriaLabel(c.categoria),
        totalGasto: c.totalGasto,
        cor: CATEGORIA_COR[c.categoria] ?? '#9ca3af',
        pct: Math.round(pct),
        dasharray,
        dashoffset
      };
    });
  }
}
