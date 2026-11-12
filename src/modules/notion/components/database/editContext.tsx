import { createContext, useContext } from 'react';

/**
 * Edição de propriedades e opções (adição GaaS). O módulo decide o que é criável e o que vem de fora:
 * - 'fixed': espelha coluna da tarefa com lista fechada (Status, Tipo, Prioridade); sem opção nova, sem renomear.
 * - 'synced': opções vêm de outra tela (frentes, projetos, iniciativas); criar grava lá, não dá para remover aqui.
 * - null: propriedade do módulo, livre.
 */
export type PropertyLock = 'fixed' | 'synced' | null;
export interface NotionEditApi {
  lockOf: (databaseId: string, propertyId: string) => PropertyLock;
  createOption: (databaseId: string, propertyId: string, name: string, rowId?: string) => Promise<string | null>;
  removeOption: (databaseId: string, propertyId: string, optionId: string) => void;
  renameProperty: (databaseId: string, propertyId: string, name: string) => void;
  deleteProperty: (databaseId: string, propertyId: string) => void;
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
