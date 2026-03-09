
import React, { useState } from 'react';

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

    return (
        <div
            className="relative h-full flex items-center"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button
                className={`
                    px-3 py-2 text-sm font-semibold tracking-wide transition-all duration-200 uppercase relative rounded-md
                    ${isActive || isOpen
                        ? 'text-slate-800 bg-slate-100'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }
                `}
            >
                {title}
                {/* Active Indicator Line */}
                {(isActive || isOpen) && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500"></span>
                )}
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
                                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
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
