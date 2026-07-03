import { Routes } from '@angular/router';
import { CalendarioComponent } from './calendario/calendario.component';
import { GastosComponent } from './gastos/gastos.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FinanceiroComponent } from './financeiro/financeiro.component';
import { OrcamentosComponent } from './orcamentos/orcamentos.component';
import { MateriaisComponent } from './materiais/materiais.component';

export const routes: Routes = [
  { path: '', redirectTo: 'calendario', pathMatch: 'full' },
  { path: 'calendario', component: CalendarioComponent },
  { path: 'gastos', component: GastosComponent },
  { path: 'orcamentos', component: OrcamentosComponent },
  { path: 'materiais', component: MateriaisComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'financeiro', component: FinanceiroComponent }
];
