import type { KeyboardEvent, ReactNode, RefObject } from "react";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Link2,
  Menu,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import "./wikiModeBar.css";

export type WikiMode = "reading" | "connections" | "notes";

/** What every Wiki screen shares: the mode switch, the AI entry and the "more" menu. */
export interface WikiBarCommon {
  mode: WikiMode;
  onBack?: () => void;
  backLabel?: string;
  onMode: (mode: WikiMode) => void;
  onAI: () => void;
  menu: ReactNode;
}

interface WikiModeBarProps extends WikiBarCommon {
  /** Floats over the map in Conexões; sits on top of the content in Leitura and Notas. */
  floating?: boolean;
  nav: { label: string; open: boolean; onToggle: () => void; controls?: string };
  search: {
    value: string;
    placeholder: string;
    ariaLabel: string;
    onChange: (value: string) => void;
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    inputRef?: RefObject<HTMLInputElement>;
    results?: ReactNode;
  };
  /** Mode-specific control placed before the mode switch (the map's theme toggle). */
  extra?: ReactNode;
}

const MODES = [
  { mode: "reading", label: "Leitura", icon: BookOpen, title: "Wiki organizada por assunto" },
  { mode: "connections", label: "Conexões", icon: Link2, title: "Mapa das conexões entre notas" },
  { mode: "notes", label: "Notas", icon: FileText, title: "Todas as notas do acervo, como no Obsidian" },
] as const;

// One bar, same order and position in the three Wiki modes, so moving between
// them never changes where things are.
export function WikiModeBar({
  floating = false,
  mode,
  onMode,
  onBack,
  backLabel,
  onAI,
  menu,
  nav,
  search,
  extra,
}: WikiModeBarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Navegação da Wiki"
      className={`wiki-bar ${floating ? "wiki-bar--floating" : "wiki-bar--fixed"}`}
    >
      <button
        type="button"
        className="wiki-bar__btn wiki-bar__icon"
        onClick={onBack || (() => window.history.back())}
        title={backLabel || "Voltar à tela anterior"}
        aria-label={backLabel || "Voltar à tela anterior"}
      >
        <ArrowLeft size={17} />
      </button>
      <button
        type="button"
        className="wiki-bar__btn"
        aria-label={nav.label}
        aria-expanded={nav.open}
        aria-controls={nav.controls}
        onClick={nav.onToggle}
      >
        <Menu size={16} />
        <span className="wiki-bar__lbl">{nav.label}</span>
      </button>
      <div className="wiki-bar__search" role="search">
        <Search size={14} className="wiki-bar__search-ico" aria-hidden="true" />
        <input
          ref={search.inputRef}
          type="search"
          value={search.value}
          aria-label={search.ariaLabel}
          placeholder={search.placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => search.onChange(e.target.value)}
          onKeyDown={search.onKeyDown}
          onFocus={search.onFocus}
          onBlur={search.onBlur}
        />
        {search.value ? (
          <button
            type="button"
            className="wiki-bar__clear"
            aria-label="Limpar busca"
            onClick={() => search.onChange("")}
          >
            <X size={13} />
          </button>
        ) : (
          <kbd>Ctrl K</kbd>
        )}
        {search.results}
      </div>
      {extra}
      <div role="group" aria-label="Modo da Wiki" className="wiki-bar__seg">
        {MODES.map((item) => (
          <button
            key={item.mode}
            type="button"
            aria-pressed={mode === item.mode}
            title={item.title}
            onClick={() => onMode(item.mode)}
          >
            <item.icon size={14} />
            <span className="wiki-bar__lbl">{item.label}</span>
          </button>
        ))}
      </div>
      <button type="button" className="wiki-bar__btn wiki-bar__ai" onClick={onAI}>
        Trabalhar com IA
      </button>
      <details className="wiki-bar__more">
        <summary className="wiki-bar__btn wiki-bar__icon" aria-label="Mais opções da Wiki" title="Mais opções">
          <MoreHorizontal size={17} />
        </summary>
        <div className="wiki-bar__menu">{menu}</div>
      </details>
    </div>
  );
}
