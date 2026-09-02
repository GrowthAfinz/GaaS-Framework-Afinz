import React, { useEffect, useRef } from 'react';

export const emailPreviewContextKey = (briefingId: string, templateId: string): string => `${briefingId}::${templateId}`;

export const shouldResetEmailPreview = (previousContext: string | null, nextContext: string): boolean => previousContext !== nextContext;

export const resetEmailPreviewScroll = (frame: HTMLIFrameElement | null): void => {
  frame?.contentWindow?.scrollTo(0, 0);
};

export const EmailPreviewFrame = ({ html, contextKey, className }: { html: string; contextKey: string; className: string }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const previousContextRef = useRef<string | null>(null);
  const resetPendingRef = useRef(true);

  if (shouldResetEmailPreview(previousContextRef.current, contextKey)) {
    previousContextRef.current = contextKey;
    resetPendingRef.current = true;
  }

  useEffect(() => {
    if (!resetPendingRef.current) return;
    resetEmailPreviewScroll(frameRef.current);
    resetPendingRef.current = false;
  }, [contextKey]);

  return (
    <iframe
      key={contextKey}
      ref={frameRef}
      title="Conteúdo renderizado do e-mail dinâmico"
      sandbox=""
      srcDoc={html}
      onLoad={() => {
        if (!resetPendingRef.current) return;
        resetEmailPreviewScroll(frameRef.current);
        resetPendingRef.current = false;
      }}
      className={className}
    />
  );
};
