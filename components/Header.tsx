
import React from 'react';
import type { Language, ActivePage } from '../types';
import { WorldIcon } from './IconComponents';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

const languages: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'zh', name: '中文' },
  { code: 'hi', name: 'हिन्दी' },
];

const NavButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out overflow-hidden group ${
      isActive
        ? 'text-white'
        : 'text-[#9CA3AF] hover:text-white'
    }`}
  >
    <span className="relative z-10">{label}</span>
    {isActive && (
      <span className="absolute inset-0 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] rounded-md"></span>
    )}
  </button>
);

export const Header: React.FC<HeaderProps> = ({ language, setLanguage, activePage, setActivePage }) => {
  return (
    <header className="bg-[#111827]/60 backdrop-blur-lg sticky top-0 z-50 border-b border-[var(--border-color)]">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center py-3">
          <h1 className="text-xl md:text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#EC4899] to-[#8B5CF6]">
            A7SASSI WEAVER
          </h1>
          <div className="flex items-center gap-2">
             <div className="relative">
                <label htmlFor="language-select" className="sr-only">Select Language</label>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <WorldIcon />
                </div>
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="pl-10 pr-4 py-2 bg-[#1F2937]/50 border border-[var(--border-color)] rounded-md appearance-none focus:ring-2 focus:ring-[#EC4899] focus:border-[#EC4899] transition text-sm"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
          </div>
        </div>
        <nav className="flex items-center justify-center space-x-1 md:space-x-2 pb-2">
            <NavButton label="Style Weaver" isActive={activePage === 'weaver'} onClick={() => setActivePage('weaver')} />
            <NavButton label="Style Lab" isActive={activePage === 'lab'} onClick={() => setActivePage('lab')} />
            <NavButton label="Style Chat" isActive={activePage === 'chat'} onClick={() => setActivePage('chat')} />
        </nav>
      </div>
    </header>
  );
};
