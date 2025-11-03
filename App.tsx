import React, { useState } from 'react';
import { Header } from './components/Header';
import { StyleWeaverPage } from './pages/StyleWeaverPage';
import { StyleLabPage } from './pages/StyleLabPage';
import { StyleChatPage } from './pages/StyleChatPage';
import type { Language, ActivePage } from './types';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [activePage, setActivePage] = useState<ActivePage>('weaver');

  const renderActivePage = () => {
    switch (activePage) {
      case 'weaver':
        return <StyleWeaverPage language={language} />;
      case 'lab':
        return <StyleLabPage language={language} />;
      case 'chat':
        return <StyleChatPage language={language} />;
      default:
        return <StyleWeaverPage language={language} />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#E5E7EB] font-sans">
      <Header 
        language={language} 
        setLanguage={setLanguage} 
        activePage={activePage}
        setActivePage={setActivePage}
      />
      <main className="container mx-auto p-4 md:p-8">
        {renderActivePage()}
      </main>
    </div>
  );
};

export default App;