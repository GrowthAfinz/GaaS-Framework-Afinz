import React from 'react';

export const emailPreviewContextKey = (briefingId: string, templateId: string): string => `${briefingId}::${templateId}`;

export const shouldResetEmailPreview = (previousContext: string | null, nextContext: string): boolean => previousContext !== nextContext;

export const EmailPreviewFrame = ({ html, contextKey, className }: { html: string; contextKey: string; className: string }) => {
  return (
    <iframe
      key={contextKey}
      title="Conteúdo renderizado do e-mail dinâmico"
      sandbox=""
      srcDoc={html}
      className={className}
    />
  );
};
