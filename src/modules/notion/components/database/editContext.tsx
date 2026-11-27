import type { NotionColor, NotionUser } from '../../types/notion';
import { createContext, useContext } from 'react';

/**
 * Edição de propriedades e opções (adição GaaS). O módulo decide o que é criável e o que vem de fora:
 * - 'fixed': espelha coluna da tarefa com lista fechada (Status, Tipo, Prioridade); sem opção nova, sem renomear.
 * - 'synced': opções vêm de outra tela (frentes, projetos, iniciativas); criar grava lá, não dá para remover aqui.
 * - null: propriedade do módulo, livre.
 */
export type PropertyLock = 'fixed' | 'synced' | null;
export interface OptionCaps {
  rename: boolean;
  color: boolean;
  reorder: boolean;
  /** 'excluir' apaga daqui; 'arquivar' arquiva na tela de origem; null não deixa tirar. */
  remove: 'excluir' | 'arquivar' | null;
  /** Quantos itens usam a opção (para avisar antes de tirar). */
  uses: number;
  /** Onde mais a mudança aparece (ex.: "Visão Daily e quadro"). */
  syncNote?: string;
  /** Por que não dá para tirar, quando não dá. */
  removeBlock?: string;
}
export interface NotionEditApi {
  lockOf: (databaseId: string, propertyId: string) => PropertyLock;
  createOption: (databaseId: string, propertyId: string, name: string, rowId?: string) => Promise<string | null>;
  /** Renomeia, troca a cor ou muda a posição (offset ±1 ou index final). Em opção sincronizada grava na tela de origem. */
  editOption?: (databaseId: string, propertyId: string, optionId: string, changes: { name?: string; color?: NotionColor; offset?: -1 | 1; index?: number }) => void | Promise<void>;
  removeOption: (databaseId: string, propertyId: string, optionId: string) => void | Promise<void>;
  /** O que dá para fazer com uma opção na própria lista. Sem esta função vale tudo menos em lista fixa. */
  optionCaps?: (databaseId: string, propertyId: string, optionId: string) => OptionCaps;
  renameProperty: (databaseId: string, propertyId: string, name: string) => void;
  deleteProperty: (databaseId: string, propertyId: string) => void;
  /** Cria pessoa só com nome (sem conta) para ser responsável. */
  createPerson?: (name: string) => Promise<NotionUser | null>;
}
const noop: NotionEditApi = {
  lockOf: () => null,
  createOption: async () => null,
  removeOption: () => undefined,
  renameProperty: () => undefined,
  deleteProperty: () => undefined,
};
export const NotionEditContext = createContext<NotionEditApi>(noop);
export const useNotionEdit = () => useContext(NotionEditContext);
