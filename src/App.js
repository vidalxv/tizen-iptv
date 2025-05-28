import React, { useState, useEffect } from 'react';
import './App.css';
import LoginScreen from './components/LoginScreen';
import Home from './components/Home';
import Sidebar from './components/Sidebar';

// Estado das seções (migrado do conceito original)
const SECTIONS = {
  LOGIN: 'login',
  HOME: 'home',
  CHANNELS: 'channels', 
  MOVIES: 'movies',
  SERIES: 'series',
  SEARCH: 'search'
};

// Menu items (do app antigo)
const menuItems = [
  { id: 'search', label: 'Pesquisar', icon: 'fa-magnifying-glass' },
  { id: 'home', label: 'Home', icon: 'fa-house' },
  { id: 'channels', label: 'Canais Ao Vivo', icon: 'fa-tv' },
  { id: 'movies', label: 'Filmes', icon: 'fa-film' },
  { id: 'series', label: 'Séries', icon: 'fa-video' },
];

function App() {
  const [currentSection, setCurrentSection] = useState(SECTIONS.LOGIN);
  const [menuFocus, setMenuFocus] = useState(1); // Iniciar no Home
  const [shelfFocus, setShelfFocus] = useState(0);
  const [itemFocus, setItemFocus] = useState(0);
  const [onMenu, setOnMenu] = useState(false);

  // Registrar teclas do controle remoto Tizen (mantido do template original)
  useEffect(() => {
    if (window.tizen && window.tizen.tvinputdevice) {
      const keys = [
        'MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop',
        'MediaFastForward', 'MediaRewind',
        'ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue',
      ];
      keys.forEach(k => window.tizen.tvinputdevice.registerKey(k));
    }
  }, []);

  // Sistema de navegação Tizen melhorado
  useEffect(() => {
    const handleKeyDown = (e) => {
      const keyCode = e.keyCode;
      
      // Se estiver na tela de login, apenas permite Enter para continuar
      if (currentSection === SECTIONS.LOGIN) {
        if (keyCode === 13) { // Enter
          handleLogin();
        }
        return;
      }

      // Navegação no menu lateral
      if (onMenu) {
        if (keyCode === 38) { // Cima
          setMenuFocus((prev) => (prev > 0 ? prev - 1 : menuItems.length - 1));
        } else if (keyCode === 40) { // Baixo
          setMenuFocus((prev) => (prev < menuItems.length - 1 ? prev + 1 : 0));
        } else if (keyCode === 39) { // Direita - sair do menu
          setOnMenu(false);
        } else if (keyCode === 13) { // OK - selecionar item do menu
          const selectedSection = menuItems[menuFocus].id;
          setCurrentSection(selectedSection);
          setOnMenu(false);
        }
      } else {
        // Navegação no conteúdo principal
        if (currentSection === SECTIONS.HOME) {
          if (keyCode === 38) { // Cima
            if (shelfFocus > 0) {
              setShelfFocus(shelfFocus - 1);
              setItemFocus(0);
            }
          } else if (keyCode === 40) { // Baixo
            setShelfFocus((prev) => Math.min(prev + 1, 2)); // Máximo 3 prateleiras
            setItemFocus(0);
          } else if (keyCode === 37) { // Esquerda
            if (itemFocus > 0) {
              setItemFocus(itemFocus - 1);
            } else {
              setOnMenu(true);
            }
          } else if (keyCode === 39) { // Direita
            setItemFocus((prev) => Math.min(prev + 1, 9)); // Máximo 10 itens por prateleira
          } else if (keyCode === 13) { // OK
            console.log('Item selecionado:', { shelfFocus, itemFocus });
            // TODO: Implementar seleção de item
          }
        } else {
          // Para outras seções, apenas navegação básica
          if (keyCode === 37) { // Esquerda - voltar ao menu
            setOnMenu(true);
          }
        }
      }

      // Botões especiais (mantidos)
      if (keyCode === 10009 || keyCode === 8) { // Return/Back
        if (currentSection !== SECTIONS.HOME) {
          setCurrentSection(SECTIONS.HOME);
          setOnMenu(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection, onMenu, menuFocus, shelfFocus, itemFocus]);

  const handleLogin = () => {
    setCurrentSection(SECTIONS.HOME);
    setOnMenu(false);
  };

  const handleSectionChange = (sectionId) => {
    setCurrentSection(sectionId);
    setOnMenu(false);
    setShelfFocus(0);
    setItemFocus(0);
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case SECTIONS.LOGIN:
        return <LoginScreen onLogin={handleLogin} />;
      
      case SECTIONS.HOME:
        return (
          <Home 
            onMenu={onMenu}
            menuFocus={menuFocus}
            shelfFocus={shelfFocus}
            itemFocus={itemFocus}
          />
        );

      default:
        return (
          <div className="main-content">
            <div className="section-placeholder">
              <div className="placeholder-content">
                <i className="fa-solid fa-construction"></i>
                <h2>Seção: {currentSection.toUpperCase()}</h2>
                <p>Esta seção será implementada em breve.</p>
                <button 
                  className="back-btn"
                  onClick={() => setCurrentSection(SECTIONS.HOME)}
                >
                  <i className="fa-solid fa-arrow-left"></i>
                  Voltar ao Home
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  // Não mostrar sidebar na tela de login
  const showSidebar = currentSection !== SECTIONS.LOGIN;

  return (
    <div className="App">
      {showSidebar && (
        <Sidebar 
          currentSection={currentSection}
          onMenu={onMenu}
          menuFocus={menuFocus}
          onSectionChange={handleSectionChange}
        />
      )}
      <div className={`app-content ${showSidebar ? 'with-sidebar' : ''}`}>
        {renderCurrentSection()}
      </div>
    </div>
  );
}

export default App;

