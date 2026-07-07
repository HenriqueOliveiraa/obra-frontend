import { Routes } from '@angular/router';
import { CalendarioComponent } from './calendario/calendario.component';
import { GastosComponent } from './gastos/gastos.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FinanceiroComponent } from './financeiro/financeiro.component';
import { OrcamentosComponent } from './orcamentos/orcamentos.component';
import { PendenciasComponent } from './pendencias/pendencias.component';
import { ListaComprasComponent } from './lista-compras/lista-compras.component';
import { TimelineComponent } from './timeline/timeline.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'pendencias', component: PendenciasComponent, canActivate: [authGuard] },
  { path: 'calendario', component: CalendarioComponent, canActivate: [authGuard] },
  { path: 'gastos', component: GastosComponent, canActivate: [authGuard] },
  { path: 'orcamentos', component: OrcamentosComponent, canActivate: [authGuard] },
  { path: 'lista-compras', component: ListaComprasComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'financeiro', component: FinanceiroComponent, canActivate: [authGuard] },
  { path: 'timeline', component: TimelineComponent, canActivate: [authGuard] }
];
