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
    LayoutDashboard,
    FolderTree,
    Settings2,
    ClipboardList
} from 'lucide-react';

export const NAV_CONFIG: NavGroup[] = [
    {
        title: 'PLANEJAMENTO',
        items: [
            { id: 'launch', label: 'Launch Planner', icon: Calendar },
            { id: 'diario', label: 'Diário de Bordo', icon: BookOpen },
        ]
    },
    {
        title: 'ANÁLISE',
        items: [
            { id: 'jornada', label: 'Jornada & Disparos', icon: TrendingUp },
            { id: 'resultados', label: 'Resultados', icon: BarChart3 },
            { id: 'relatorio', label: 'Relatório', icon: ClipboardList },
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
            { id: 'explorador', label: 'Explorador', icon: FolderTree },
            { id: 'framework', label: 'Explorador de Disparos', icon: LayoutDashboard },
            { id: 'configuracoes', label: 'Configurações', icon: Settings2 },
        ]
    }
];
