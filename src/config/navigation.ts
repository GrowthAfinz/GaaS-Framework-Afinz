export type NavItem = {
    id: string;
    label: string;
    icon: any; // Using 'any' to avoid complex Lucide type imports for now, or could use React.ElementType
    path?: string; // Future proofing for routing
};

export type NavGroup = {
    title: string;
    items: NavItem[];
};

import {
    Calendar,
    BookOpen,
    TrendingUp,
    BarChart3,
    Lightbulb,
    PieChart,
    Wallet,
    FolderTree,
    Settings2,
    ClipboardList,
    BrainCircuit
} from 'lucide-react';

export const NAV_CONFIG: NavGroup[] = [
    {
        title: 'PLANEJAMENTO',
        items: [
            { id: 'operacao', label: 'Operação', icon: Calendar },
            { id: 'launch', label: 'Launch Planner', icon: Calendar },
        ]
    },
    {
        title: 'ANÁLISE',
        items: [
            { id: 'jornada', label: 'Jornada & Disparos', icon: TrendingUp },
            { id: 'resultados', label: 'Resultados', icon: BarChart3 },
            { id: 'relatorio', label: 'Relatórios | Aquisição', icon: ClipboardList },
            { id: 'relatorio-seguros', label: 'Relatórios | Seguros', icon: ClipboardList },
            { id: 'orientador', label: 'Orientador', icon: Lightbulb },
        ]
    },
    {
        title: 'ORIGEM',
        items: [
            { id: 'originacao-b2c', label: 'Originação B2C', icon: PieChart },
            { id: 'midia-paga', label: 'Media Analytics', icon: Wallet },
        ]
    },
    {
        title: 'FRAMEWORK',
        items: [
            { id: 'explorador', label: 'Aquisição', icon: undefined },
            { id: 'aprendizado-growth', label: 'Loop de Memória', icon: undefined },
            { id: 'configuracoes', label: 'Configurações', icon: Settings2 },
        ]
    }
];
