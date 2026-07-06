import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiaTrabalhoService } from '../core/dia-trabalho.service';
import { DiaTrabalho } from '../core/models';
import { CardComponent } from '../shared/ui/card/card.component';
import { PainelComponent } from '../shared/ui/painel/painel.component';

interface CelulaDia {
  dia: number;
  data: string;
  registro?: DiaTrabalho;
}

const NOMES_MES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, PainelComponent],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements OnInit {
  private service = inject(DiaTrabalhoService);

  ano = new Date().getFullYear();
  mes = new Date().getMonth() + 1;
  nomeMes = '';
  espacosVazios: number[] = [];
  dias: CelulaDia[] = [];
  registros: DiaTrabalho[] = [];
  diasTrabalhados = 0;

  form: DiaTrabalho = { data: this.formatarData(new Date()), trabalhou: true, observacao: '' };

  ngOnInit(): void {
    this.carregarMes();
  }

  carregarMes(): void {
    this.nomeMes = NOMES_MES[this.mes - 1];
    this.service.listarPorMes(this.ano, this.mes).subscribe(registros => {
      this.registros = registros;
      this.montarGrade();
      this.diasTrabalhados = registros.filter(r => r.trabalhou).length;
    });
  }

  montarGrade(): void {
    const primeiroDia = new Date(this.ano, this.mes - 1, 1);
    const diasNoMes = new Date(this.ano, this.mes, 0).getDate();
    const offset = primeiroDia.getDay();

    this.espacosVazios = Array.from({ length: offset }, (_, i) => i);
    this.dias = Array.from({ length: diasNoMes }, (_, i) => {
      const dia = i + 1;
      const data = this.formatarData(new Date(this.ano, this.mes - 1, dia));
      const registro = this.registros.find(r => r.data === data);
      return { dia, data, registro };
    });
  }

  mesAnterior(): void {
    this.mes--;
    if (this.mes < 1) { this.mes = 12; this.ano--; }
    this.carregarMes();
  }

  mesProximo(): void {
    this.mes++;
    if (this.mes > 12) { this.mes = 1; this.ano++; }
    this.carregarMes();
  }

  selecionarDia(celula: CelulaDia): void {
    this.form = {
      data: celula.data,
      trabalhou: celula.registro?.trabalhou ?? true,
      observacao: celula.registro?.observacao ?? ''
    };
  }

  salvar(): void {
    const existente = this.registros.find(r => r.data === this.form.data);
    const acao = existente?.id
      ? this.service.atualizar(existente.id, this.form)
      : this.service.criar(this.form);

    acao.subscribe(() => this.carregarMes());
  }

  registroAtual(): DiaTrabalho | undefined {
    return this.registros.find(r => r.data === this.form.data);
  }

  excluir(id: number | undefined): void {
    if (!id) { return; }
    this.service.excluir(id).subscribe(() => {
      this.form = { data: this.form.data, trabalhou: true, observacao: '' };
      this.carregarMes();
    });
  }

  classeCelula(celula: CelulaDia): string {
    if (!celula.registro) { return ''; }
    return celula.registro.trabalhou ? 'trabalhou' : 'nao-trabalhou';
  }

  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}
