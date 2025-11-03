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
    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-pink-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {label}
  </button>
);

export const Header: React.FC<HeaderProps> = ({ language, setLanguage, activePage, setActivePage }) => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 shadow-lg shadow-pink-500/10">
      <div className="container mx-auto px-4 md:px-8 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
            AI Style Weaver
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
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md appearance-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition text-sm"
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
        <nav className="mt-3 flex items-center justify-center bg-gray-800/50 p-1 rounded-lg space-x-2">
            <NavButton label="Style Weaver" isActive={activePage === 'weaver'} onClick={() => setActivePage('weaver')} />
            <NavButton label="Style Lab" isActive={activePage === 'lab'} onClick={() => setActivePage('lab')} />
            <NavButton label="Style Chat" isActive={activePage === 'chat'} onClick={() => setActivePage('chat')} />
        </nav>
      </div>
    </header>
  );
};
