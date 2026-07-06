import { Routes } from '@angular/router';
import { CalendarioComponent } from './calendario/calendario.component';
import { GastosComponent } from './gastos/gastos.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FinanceiroComponent } from './financeiro/financeiro.component';
import { OrcamentosComponent } from './orcamentos/orcamentos.component';
import { PendenciasComponent } from './pendencias/pendencias.component';
import { ListaComprasComponent } from './lista-compras/lista-compras.component';

export const routes: Routes = [
  { path: '', redirectTo: 'pendencias', pathMatch: 'full' },
  { path: 'pendencias', component: PendenciasComponent },
  { path: 'calendario', component: CalendarioComponent },
  { path: 'gastos', component: GastosComponent },
  { path: 'orcamentos', component: OrcamentosComponent },
  { path: 'lista-compras', component: ListaComprasComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'financeiro', component: FinanceiroComponent }
];
