import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiaTrabalhoService } from '../core/dia-trabalho.service';
import { DiaTrabalho } from '../core/models';
import { ModalSucessoComponent } from '../shared/modais/modal-sucesso/modal-sucesso.component';
import { ModalErroComponent } from '../shared/modais/modal-erro/modal-erro.component';
import { ModalConfirmacaoComponent } from '../shared/modais/modal-confirmacao/modal-confirmacao.component';

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
  imports: [CommonModule, FormsModule, ModalSucessoComponent, ModalErroComponent, ModalConfirmacaoComponent],
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

  mostrarConfirmacaoSalvar = false;
  mostrarSucesso = false;
  mostrarErro = false;
  mensagemErro = '';

  mostrarConfirmacaoExcluir = false;
  mostrarSucessoExclusao = false;
  mostrarErroExclusao = false;
  mensagemErroExclusao = '';
  private idParaExcluir: number | null = null;

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
    this.mostrarConfirmacaoSalvar = true;
  }

  confirmarSalvar(): void {
    this.mostrarConfirmacaoSalvar = false;
    const existente = this.registros.find(r => r.data === this.form.data);
    const acao = existente?.id
      ? this.service.atualizar(existente.id, this.form)
      : this.service.criar(this.form);

    acao.subscribe({
      next: () => {
        this.carregarMes();
        this.mostrarSucesso = true;
      },
      error: () => {
        this.mensagemErro = 'Não foi possível salvar o registro deste dia. Tente novamente.';
        this.mostrarErro = true;
      }
    });
  }

  cancelarSalvar(): void {
    this.mostrarConfirmacaoSalvar = false;
  }

  registroAtual(): DiaTrabalho | undefined {
    return this.registros.find(r => r.data === this.form.data);
  }

  abrirConfirmacaoExclusao(id: number | undefined): void {
    if (!id) { return; }
    this.idParaExcluir = id;
    this.mostrarConfirmacaoExcluir = true;
  }

  confirmarExclusao(): void {
    if (!this.idParaExcluir) { return; }
    const id = this.idParaExcluir;
    this.mostrarConfirmacaoExcluir = false;

    this.service.excluir(id).subscribe({
      next: () => {
        this.idParaExcluir = null;
        this.form = { data: this.form.data, trabalhou: true, observacao: '' };
        this.carregarMes();
        this.mostrarSucessoExclusao = true;
      },
      error: () => {
        this.idParaExcluir = null;
        this.mensagemErroExclusao = 'Não foi possível excluir este registro. Tente novamente.';
        this.mostrarErroExclusao = true;
      }
    });
  }

  cancelarExclusao(): void {
    this.mostrarConfirmacaoExcluir = false;
    this.idParaExcluir = null;
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
