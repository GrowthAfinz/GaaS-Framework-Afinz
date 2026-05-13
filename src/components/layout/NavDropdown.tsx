import React, { useEffect, useRef, useState } from 'react';

interface NavItem {
    id: string;
    label: string;
    icon?: React.ElementType;
    onClick: () => void;
    isActive?: boolean;
}

interface NavDropdownProps {
    title: string;
    items: NavItem[];
    isActive?: boolean;
}

export const NavDropdown: React.FC<NavDropdownProps> = ({ title, items, isActive }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative h-full flex items-center"
        >
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`
                    flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                    ${isActive || isOpen
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                    }
                `}
            >
                {title}
            </button>

            {/* Dropdown Menu */}
            <div
                className={`
                    absolute top-full left-0 pt-2 w-48 transform transition-all duration-200 origin-top-left
                    ${isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'}
                `}
            >
                <div className="bg-white border border-slate-200 rounded-lg shadow-xl p-1.5 z-50">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                item.onClick();
                                setIsOpen(false);
                            }}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left
                                ${item.isActive
                                    ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }
                            `}
                        >
                            {item.icon && <item.icon size={16} />}
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
