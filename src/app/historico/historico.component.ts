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

const EVENTOS_FICTICIOS: AuditoriaEvento[] = [
  {
    id: 'f1',
    usuarioId: '1',
    usuarioNome: 'Henrique',
    entidade: 'gasto',
    entidadeId: '101',
    entidadeDescricao: 'Cimento CP-II 50kg',
    acao: 'CRIACAO',
    descricao: 'Criou o gasto "Cimento CP-II 50kg" no valor de R$ 320,00',
    criadoEm: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'f2',
    usuarioId: '2',
    usuarioNome: 'Maria',
    entidade: 'item_compra',
    entidadeId: '55',
    entidadeDescricao: 'Rejunte cinza',
    acao: 'EDICAO',
    descricao: 'Marcou "Rejunte cinza" como comprado',
    dadosAnteriores: { status: 'Pendente' },
    dadosNovos: { status: 'Comprado' },
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'f3',
    usuarioId: '1',
    usuarioNome: 'Henrique',
    entidade: 'orcamento',
    entidadeId: '12',
    entidadeDescricao: 'Reforma do banheiro',
    acao: 'EDICAO',
    descricao: 'Atualizou o orçamento "Reforma do banheiro"',
    dadosAnteriores: { valorTotal: 8500, prazoDias: 30 },
    dadosNovos: { valorTotal: 9200, prazoDias: 35 },
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'f4',
    usuarioId: '2',
    usuarioNome: 'Maria',
    entidade: 'item_compra',
    entidadeId: '58',
    entidadeDescricao: 'Fio elétrico 10 Amarelo',
    acao: 'CRIACAO',
    descricao: 'Adicionou o item "Fio elétrico 10 Amarelo" à lista de compras',
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: 'f5',
    usuarioId: '1',
    usuarioNome: 'Henrique',
    entidade: 'gasto',
    entidadeId: '98',
    entidadeDescricao: 'Frete de material',
    acao: 'EXCLUSAO',
    descricao: 'Excluiu o gasto "Frete de material" lançado por engano',
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: 'f6',
    usuarioId: '2',
    usuarioNome: 'Maria',
    entidade: 'gasto',
    entidadeId: '99',
    entidadeDescricao: 'Pedreiro - diária',
    acao: 'CRIACAO',
    descricao: 'Criou o gasto "Pedreiro - diária" no valor de R$ 180,00',
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },
  {
    id: 'f7',
    usuarioId: '1',
    usuarioNome: 'Henrique',
    entidade: 'item_compra',
    entidadeId: '60',
    entidadeDescricao: 'Tinta branca 18L',
    acao: 'CRIACAO',
    descricao: 'Adicionou o item "Tinta branca 18L" à lista de compras',
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 55).toISOString(),
  },
  {
    id: 'f8',
    usuarioId: '2',
    usuarioNome: 'Maria',
    entidade: 'orcamento',
    entidadeId: '13',
    entidadeDescricao: 'Pintura externa',
    acao: 'EDICAO',
    descricao: 'Atualizou o orçamento "Pintura externa"',
    dadosAnteriores: { valorTotal: 4200 },
    dadosNovos: { valorTotal: 4600 },
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
  },
  {
    id: 'f9',
    usuarioId: '1',
    usuarioNome: 'Henrique',
    entidade: 'gasto',
    entidadeId: '102',
    entidadeDescricao: 'Areia média m³',
    acao: 'CRIACAO',
    descricao: 'Criou o gasto "Areia média m³" no valor de R$ 210,00',
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
  },
  {
    id: 'f10',
    usuarioId: '2',
    usuarioNome: 'Maria',
    entidade: 'item_compra',
    entidadeId: '61',
    entidadeDescricao: 'Torneira monocomando',
    acao: 'EXCLUSAO',
    descricao: 'Excluiu o item "Torneira monocomando" da lista, comprado por engano em duplicidade',
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 78).toISOString(),
  },
  {
    id: 'f11',
    usuarioId: '1',
    usuarioNome: 'Henrique',
    entidade: 'orcamento',
    entidadeId: '14',
    entidadeDescricao: 'Elétrica geral',
    acao: 'EDICAO',
    descricao: 'Atualizou o orçamento "Elétrica geral"',
    dadosAnteriores: { prazoDias: 20 },
    dadosNovos: { prazoDias: 25 },
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 90).toISOString(),
  },
];

const USUARIOS_FICTICIOS: UsuarioResumo[] = [
  { id: '1', nome: 'Henrique' },
  { id: '2', nome: 'Maria' },
];

const ENTIDADES_FICTICIAS: EntidadeResumo[] = [
  { chave: 'gasto', rotulo: 'Gastos' },
  { chave: 'item_compra', rotulo: 'Lista de compras' },
  { chave: 'orcamento', rotulo: 'Orçamentos' },
];

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
          const filtrados = this.filtrarEventosFicticios(filtro);
          const inicio = (this.pagina() - 1) * this.tamanhoPagina;
          this.eventos.set(filtrados.slice(inicio, inicio + this.tamanhoPagina));
          this.total.set(filtrados.length);
          this.erro.set(null);
          this.carregando.set(false);
        },
      });
  }

  private filtrarEventosFicticios(filtro: FiltroAuditoria): AuditoriaEvento[] {
    const termoBusca = filtro.busca?.trim().toLowerCase();
    const inicio = filtro.dataInicio ? new Date(`${filtro.dataInicio}T00:00:00`) : null;
    const fim = filtro.dataFim ? new Date(`${filtro.dataFim}T23:59:59`) : null;

    return EVENTOS_FICTICIOS.filter((evento) => {
      if (filtro.usuarioId && evento.usuarioId !== filtro.usuarioId) return false;
      if (filtro.entidade && evento.entidade !== filtro.entidade) return false;
      if (filtro.acao && evento.acao !== filtro.acao) return false;

      const dataEvento = new Date(evento.criadoEm);
      if (inicio && dataEvento < inicio) return false;
      if (fim && dataEvento > fim) return false;

      if (termoBusca) {
        const alvo = `${evento.descricao} ${evento.entidadeDescricao ?? ''}`.toLowerCase();
        if (!alvo.includes(termoBusca)) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  private carregarOpcoesDeFiltro(): void {
    this.auditoriaService
      .listarUsuarios()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (usuarios) => this.usuarios.set(usuarios),
        // MOCK: remover quando o endpoint /auditoria/usuarios existir de verdade.
        error: () => this.usuarios.set(USUARIOS_FICTICIOS),
      });

    this.auditoriaService
      .listarEntidades()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entidades) => this.entidades.set(entidades),
        // MOCK: remover quando o endpoint /auditoria/entidades existir de verdade.
        error: () => this.entidades.set(ENTIDADES_FICTICIAS),
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
