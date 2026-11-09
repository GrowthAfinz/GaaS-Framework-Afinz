import { useMemo, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { WikiCodeBlock } from "../WikiDiagram";
import { WikiMarkdownSections } from "../WikiMarkdownSections";
import { rewriteWikilinksForReader } from "../vaultParser";
import { vaultUrlTransform } from "../vaultMarkdown";
import type { VaultNoteSummary } from "../vaultTypes";
import { resolveWikiTarget } from "../wikiNavigation";

// The whole note inside the map's side panel. Styled by the map's own tokens
// (.wm-note in wikiMap3d.css) so it follows the map's light and dark themes.
// A wikilink selects the linked note on the map instead of leaving it.
export function WikiMapNote({
  markdown,
  path,
  notes,
  onPickNote,
}: {
  markdown: string;
  path: string;
  notes: VaultNoteSummary[];
  onPickNote: (id: string) => void;
}) {
  // the panel already shows the title, so the note's own H1 is dropped
  const content = useMemo(() => rewriteWikilinksForReader(markdown).replace(/^\s*# [^\n]+\r?\n/, ""), [markdown]);
  const link = ({ href, children }: { href?: string; children?: ReactNode }) => {
    if (!href) return <span>{children}</span>;
    if (href.startsWith("#")) return <span>{children}</span>;
    if (!href.startsWith("vault:")) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
          <ExternalLink size={11} className="wm-note__ext" aria-label="Link externo" />
        </a>
      );
    }
    const target = decodeURIComponent(href.slice(6)).split("#")[0];
    const found = target ? resolveWikiTarget(notes, target, path)[0] : undefined;
    if (!found) return <span className="wm-note__missing" title="Nota não encontrada no acervo">{children}</span>;
    return (
      <a
        href="#"
        title="Mostrar esta nota no mapa"
        onClick={(event) => {
          event.preventDefault();
          onPickNote(found.id);
        }}
      >
        {children}
      </a>
    );
  };
  if (!content.trim()) return <p className="wm-note__empty">Esta nota ainda não tem conteúdo de leitura.</p>;
  return (
    <div className="wm-note">
      <WikiMarkdownSections
        content={content}
        render={(part) => (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            urlTransform={vaultUrlTransform}
            components={{
              h1: ({ children }) => <h4>{children}</h4>,
              h2: ({ children }) => <h4>{children}</h4>,
              h3: ({ children }) => <h5>{children}</h5>,
              h4: ({ children }) => <h6>{children}</h6>,
              table: ({ children }) => (
                <div className="wm-note__table" role="region" aria-label="Tabela da nota" tabIndex={0}>
                  <table>{children}</table>
                </div>
              ),
              pre: WikiCodeBlock,
              a: link,
            }}
          >
            {part}
          </ReactMarkdown>
        )}
      />
    </div>
  );
}
