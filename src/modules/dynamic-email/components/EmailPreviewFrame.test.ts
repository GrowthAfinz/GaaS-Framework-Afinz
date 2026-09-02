import { describe, expect, it, vi } from 'vitest';
import { emailPreviewContextKey, resetEmailPreviewScroll, shouldResetEmailPreview } from './EmailPreviewFrame';

describe('EmailPreviewFrame', () => {
  it('muda o contexto ao trocar e-mail ou assinatura', () => {
    expect(emailPreviewContextKey('email-1-amigao', 'plurix-v7')).not.toBe(emailPreviewContextKey('email-7-amigao', 'plurix-v7'));
    expect(emailPreviewContextKey('email-1-amigao', 'plurix-v7')).not.toBe(emailPreviewContextKey('email-1-boa', 'plurix-v7'));
  });

  it('muda o contexto ao trocar o template', () => {
    expect(emailPreviewContextKey('email-1-amigao', 'plurix-v6')).not.toBe(emailPreviewContextKey('email-1-amigao', 'plurix-v7'));
  });

  it('mantém o contexto estável quando e-mail, assinatura e template não mudam', () => {
    const context = emailPreviewContextKey('email-7-amigao', 'plurix-v7');
    expect(context).toBe(emailPreviewContextKey('email-7-amigao', 'plurix-v7'));
    expect(shouldResetEmailPreview(context, context)).toBe(false);
  });

  it('solicita reset apenas quando a chave de contexto muda', () => {
    expect(shouldResetEmailPreview(null, 'email-1::plurix-v7')).toBe(true);
    expect(shouldResetEmailPreview('email-1::plurix-v7', 'email-7::plurix-v7')).toBe(true);
    expect(shouldResetEmailPreview('email-7::plurix-v7', 'email-7::plurix-v7')).toBe(false);
  });

  it('leva o documento do iframe ao topo', () => {
    const scrollTo = vi.fn();
    resetEmailPreviewScroll({ contentWindow: { scrollTo } } as unknown as HTMLIFrameElement);
    expect(scrollTo).toHaveBeenCalledOnce();
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
