import { Routes } from '@angular/router';
import { CalendarioComponent } from './calendario/calendario.component';
import { GastosComponent } from './gastos/gastos.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'calendario', pathMatch: 'full' },
  { path: 'calendario', component: CalendarioComponent },
  { path: 'gastos', component: GastosComponent },
  { path: 'dashboard', component: DashboardComponent }
];
