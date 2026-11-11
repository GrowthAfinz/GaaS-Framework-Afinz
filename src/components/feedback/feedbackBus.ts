// Ponte leve entre as telas e o botão fixo "Declarar melhoria".
import type { FeedbackTarget } from './feedbackModel';

const OPEN_EVENT = 'gaas:feedback-open';
const CHANGED_EVENT = 'gaas:feedback-changed';
let pageTarget: FeedbackTarget | null = null;

/** A tela informa o item em foco (ex.: a nota aberta na Wiki). O botão fixo usa isso como contexto padrão. */
export function setFeedbackPageTarget(target: FeedbackTarget | null): void {
  pageTarget = target;
}

export function currentFeedbackPageTarget(): FeedbackTarget | null {
  return pageTarget;
}

/** Abre o formulário já ancorado num item. Sem alvo, usa o contexto da página atual. */
export function openFeedback(target?: FeedbackTarget): void {
  window.dispatchEvent(new CustomEvent<FeedbackTarget | undefined>(OPEN_EVENT, { detail: target }));
}

export function onFeedbackOpen(listener: (target?: FeedbackTarget) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<FeedbackTarget | undefined>).detail);
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}

/** Avisa as telas que um comentário foi criado, editado ou excluído. */
export function notifyFeedbackChanged(): void {
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function onFeedbackChanged(listener: () => void): () => void {
  window.addEventListener(CHANGED_EVENT, listener);
  return () => window.removeEventListener(CHANGED_EVENT, listener);
}
