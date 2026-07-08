import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { DropdownOpcao, DropdownSelectComponent } from '../gastos/gastos.component';
import {
  AcaoAuditoria,
  AuditoriaEvento,
  EntidadeResumo,
  FiltroAuditoria,
  UsuarioResumo,
} from './auditoria.model';
import { AuditoriaService } from './auditoria.service';

interface GrupoDeDia {
  rotulo: string;
  eventos: AuditoriaEvento[];
}

const ROTULOS_ACAO: Record<AcaoAuditoria, string> = {
  CRIACAO: 'Criação',
  EDICAO: 'Edição',
  EXCLUSAO: 'Exclusão',
};

const ACAO_OPTIONS: DropdownOpcao[] = [
  { value: '', label: 'Todas as ações' },
  { value: 'CRIACAO', label: 'Só criações' },
  { value: 'EDICAO', label: 'Só edições' },
  { value: 'EXCLUSAO', label: 'Só exclusões' },
];

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DropdownSelectComponent],
  templateUrl: './historico.component.html',
  styleUrl: './historico.component.css',
})
export class HistoricoComponent implements OnInit {
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly rotulosAcao = ROTULOS_ACAO;
  readonly acaoOptions = ACAO_OPTIONS;

  readonly tamanhoPagina = 6;
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly eventos = signal<AuditoriaEvento[]>([]);
  readonly total = signal(0);
  readonly pagina = signal(1);

  readonly usuarios = signal<UsuarioResumo[]>([]);
  readonly entidades = signal<EntidadeResumo[]>([]);

  readonly usuarioOptions = computed<DropdownOpcao[]>(() => [
    { value: '', label: 'Todos os usuários' },
    ...this.usuarios().map((usuario) => ({ value: usuario.id, label: usuario.nome })),
  ]);

  readonly entidadeOptions = computed<DropdownOpcao[]>(() => [
    { value: '', label: 'Todos os módulos' },
    ...this.entidades().map((item) => ({ value: item.chave, label: item.rotulo })),
  ]);

  // ---- filtros ----
  usuarioId = '';
  entidade = '';
  acao: AcaoAuditoria | '' = '';
  dataInicio = '';
  dataFim = '';
  busca = '';

  private readonly buscaSubject = new Subject<string>();

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.tamanhoPagina))
  );

  readonly grupos = computed<GrupoDeDia[]>(() => this.agruparPorDia(this.eventos()));

  readonly paginasVisiveis = computed<(number | string)[]>(() =>
    this.calcularPaginasVisiveis(this.pagina(), this.totalPaginas())
  );

  readonly temFiltroAtivo = computed(
    () =>
      !!this.usuarioId ||
      !!this.entidade ||
      !!this.acao ||
      !!this.dataInicio ||
      !!this.dataFim ||
      !!this.busca
  );

  ngOnInit(): void {
    this.carregarOpcoesDeFiltro();
    this.carregar();

    this.buscaSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.aplicarFiltros());
  }

  aoDigitarBusca(valor: string): void {
    this.busca = valor;
    this.buscaSubject.next(valor);
  }

  selecionarUsuario(valor: string): void {
    this.usuarioId = valor;
    this.aplicarFiltros();
  }

  selecionarEntidade(valor: string): void {
    this.entidade = valor;
    this.aplicarFiltros();
  }

  selecionarAcao(valor: string): void {
    this.acao = (valor as AcaoAuditoria) || '';
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.pagina.set(1);
    this.carregar();
  }

  limparFiltros(): void {
    this.usuarioId = '';
    this.entidade = '';
    this.acao = '';
    this.dataInicio = '';
    this.dataFim = '';
    this.busca = '';
    this.aplicarFiltros();
  }

  irParaPagina(numero: number): void {
    if (numero < 1 || numero > this.totalPaginas()) return;
    this.pagina.set(numero);
    this.carregar();
  }

  camposAlterados(evento: AuditoriaEvento): { campo: string; de: unknown; para: unknown }[] {
    const antes = evento.dadosAnteriores ?? {};
    const depois = evento.dadosNovos ?? {};
    const chaves = new Set([...Object.keys(antes), ...Object.keys(depois)]);

    const resultado: { campo: string; de: unknown; para: unknown }[] = [];
    chaves.forEach((chave) => {
      const de = (antes as Record<string, unknown>)[chave];
      const para = (depois as Record<string, unknown>)[chave];
      if (JSON.stringify(de) !== JSON.stringify(para)) {
        resultado.push({ campo: this.rotuloCampo(chave), de, para });
      }
    });
    return resultado;
  }

  private rotuloCampo(campo: string): string {
    const comEspacos = campo
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .toLowerCase();
    return comEspacos.charAt(0).toUpperCase() + comEspacos.slice(1);
  }

  private carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    const filtro: FiltroAuditoria = {
      usuarioId: this.usuarioId || undefined,
      entidade: this.entidade || undefined,
      acao: (this.acao as AcaoAuditoria) || undefined,
      dataInicio: this.dataInicio || undefined,
      dataFim: this.dataFim || undefined,
      busca: this.busca || undefined,
      pagina: this.pagina(),
      tamanhoPagina: this.tamanhoPagina,
    };

    this.auditoriaService
      .listar(filtro)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resposta) => {
          this.eventos.set(resposta.itens);
          this.total.set(resposta.total);
          this.carregando.set(false);
        },
        error: () => {
          this.eventos.set([]);
          this.total.set(0);
          this.erro.set('Não foi possível carregar o histórico. Tente novamente.');
          this.carregando.set(false);
        },
      });
  }

  private carregarOpcoesDeFiltro(): void {
    this.auditoriaService
      .listarUsuarios()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (usuarios) => this.usuarios.set(usuarios),
        error: () => this.usuarios.set([]),
      });

    this.auditoriaService
      .listarEntidades()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entidades) => this.entidades.set(entidades),
        error: () => this.entidades.set([]),
      });
  }

  private calcularPaginasVisiveis(atual: number, total: number): (number | string)[] {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const paginas: (number | string)[] = [1];
    if (atual > 3) { paginas.push('...'); }
    const inicio = Math.max(2, atual - 1);
    const fim = Math.min(total - 1, atual + 1);
    for (let i = inicio; i <= fim; i++) { paginas.push(i); }
    if (atual < total - 2) { paginas.push('...'); }
    paginas.push(total);
    return paginas;
  }

  private agruparPorDia(eventos: AuditoriaEvento[]): GrupoDeDia[] {
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);

    const chave = (data: Date) => data.toDateString();
    const mapa = new Map<string, AuditoriaEvento[]>();

    for (const evento of eventos) {
      const data = new Date(evento.criadoEm);
      const k = chave(data);
      if (!mapa.has(k)) mapa.set(k, []);
      mapa.get(k)!.push(evento);
    }

    const grupos: GrupoDeDia[] = [];
    mapa.forEach((lista, k) => {
      let rotulo: string;
      if (k === chave(hoje)) rotulo = 'Hoje';
      else if (k === chave(ontem)) rotulo = 'Ontem';
      else {
        const data = new Date(lista[0].criadoEm);
        rotulo = data.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      }
      grupos.push({ rotulo, eventos: lista });
    });

    return grupos;
  }
}
