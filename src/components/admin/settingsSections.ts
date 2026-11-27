/**
 * Seções de Configurações (formato Setup). A seção fica no parâmetro `cfg` da URL:
 * `section` já é usado pelo roteamento do Loop, então não dá para reaproveitar.
 * Os atalhos antigos via sessionStorage continuam funcionando.
 */
export type SettingsSection = 'atualizar' | 'historico' | 'arquivos' | 'metas' | 'sfmc' | 'usuarios' | 'conta';

export const SETTINGS_SECTIONS: readonly SettingsSection[] = ['atualizar', 'historico', 'arquivos', 'metas', 'sfmc', 'usuarios', 'conta'];

const LEGACY_SHORTCUTS: Array<{ key: string; value: string; section: SettingsSection }> = [
    { key: 'gaas-settings-tab', value: 'sfmc', section: 'sfmc' },
    { key: 'gaas.configuracoes.tab', value: 'goals', section: 'metas' },
];

export const isSettingsSection = (value: unknown): value is SettingsSection =>
    typeof value === 'string' && (SETTINGS_SECTIONS as readonly string[]).includes(value);

export function readSettingsSection(search = typeof window !== 'undefined' ? window.location.search : ''): SettingsSection {
    try {
        for (const shortcut of LEGACY_SHORTCUTS) {
            if (sessionStorage.getItem(shortcut.key) === shortcut.value) {
                sessionStorage.removeItem(shortcut.key);
                return shortcut.section;
            }
        }
    } catch {
        // sessionStorage indisponível: segue para a URL.
    }
    const fromUrl = new URLSearchParams(search).get('cfg');
    return isSettingsSection(fromUrl) ? fromUrl : 'atualizar';
}

/** URL (sem o hash) da seção: serve de href do menu lateral, para o clique do meio abrir numa aba nova. */
export function settingsSectionHref(section: SettingsSection, search = window.location.search): string {
    const params = new URLSearchParams(search);
    if (section === 'atualizar') params.delete('cfg');
    else params.set('cfg', section);
    const query = params.toString();
    return window.location.pathname + (query ? `?${query}` : '');
}

export function writeSettingsSection(section: SettingsSection) {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('cfg') === section) return;
    window.history.pushState({}, '', settingsSectionHref(section) + window.location.hash);
}
