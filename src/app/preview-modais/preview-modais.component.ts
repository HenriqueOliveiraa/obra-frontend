import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModalSucessoComponent } from '../shared/modais/modal-sucesso/modal-sucesso.component';
import { ModalErroComponent } from '../shared/modais/modal-erro/modal-erro.component';
import { ModalSairComponent } from '../shared/modais/modal-sair/modal-sair.component';
import { ModalConfirmacaoComponent } from '../shared/modais/modal-confirmacao/modal-confirmacao.component';

@Component({
  selector: 'app-preview-modais',
  standalone: true,
  imports: [
    CommonModule,
    ModalSucessoComponent,
    ModalErroComponent,
    ModalSairComponent,
    ModalConfirmacaoComponent
  ],
  templateUrl: './preview-modais.component.html',
  styleUrls: ['./preview-modais.component.css']
})
export class PreviewModaisComponent {
  mostrarSucesso = false;
  mostrarErro = false;
  mostrarSair = false;
  mostrarConfirmacao = false;

  abrir(modal: 'sucesso' | 'erro' | 'sair' | 'confirmacao'): void {
    this.mostrarSucesso = modal === 'sucesso';
    this.mostrarErro = modal === 'erro';
    this.mostrarSair = modal === 'sair';
    this.mostrarConfirmacao = modal === 'confirmacao';
  }

  fecharTudo(): void {
    this.mostrarSucesso = false;
    this.mostrarErro = false;
    this.mostrarSair = false;
    this.mostrarConfirmacao = false;
  }
}
