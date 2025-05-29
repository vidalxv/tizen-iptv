import React, { useState, useEffect } from 'react';
import './App.css';
import LoginScreen from './components/LoginScreen';
import Home from './components/Home';
import Sidebar from './components/Sidebar';
import Channels from './components/Channels';
import Movies from './components/Movies';
import Series from './components/Series';
import SeriesDetailsPage from './components/SeriesDetailsPage';
import Search from './components/Search';
import VideoPlayer from './components/VideoPlayer';

// Estado das seções (migrado do conceito original)
const SECTIONS = {
  LOGIN: 'login',
  HOME: 'home',
  CHANNELS: 'channels', 
  MOVIES: 'movies',
  SERIES: 'series',
  SERIES_DETAILS: 'series_details',
  SEARCH: 'search',
  PLAYER: 'player'
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

  // Estados do VideoPlayer
  const [playerData, setPlayerData] = useState({
    streamUrl: '',
    streamInfo: null
  });

  // Estado para a página de detalhes da série
  const [selectedSeriesData, setSelectedSeriesData] = useState(null);

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

      // Se estiver no player, delegar navegação específica
      if (currentSection === SECTIONS.PLAYER) {
        const playerEvent = new CustomEvent('playerNavigation', {
          detail: { keyCode }
        });
        window.dispatchEvent(playerEvent);
        return;
      }

      // Se estiver na página de detalhes da série, delegar navegação específica
      if (currentSection === SECTIONS.SERIES_DETAILS) {
        const seriesDetailsEvent = new CustomEvent('seriesDetailsNavigation', {
          detail: { keyCode }
        });
        window.dispatchEvent(seriesDetailsEvent);
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
        } else if (currentSection === SECTIONS.CHANNELS) {
          // Navegação específica para canais - delegar todas as teclas
          if (keyCode === 38 || keyCode === 40 || keyCode === 37 || keyCode === 39 || keyCode === 13) {
            // Delegar navegação para o componente Channels através de eventos customizados
            const channelsEvent = new CustomEvent('channelsNavigation', {
              detail: { keyCode }
            });
            window.dispatchEvent(channelsEvent);
          }
        } else if (currentSection === SECTIONS.MOVIES) {
          // Navegação específica para filmes - delegar todas as teclas
          if (keyCode === 38 || keyCode === 40 || keyCode === 37 || keyCode === 39 || keyCode === 13 || keyCode === 73) {
            // Delegar navegação para o componente Movies através de eventos customizados
            // keyCode 73 = Tecla 'I' para preview
            const moviesEvent = new CustomEvent('moviesNavigation', {
              detail: { keyCode }
            });
            window.dispatchEvent(moviesEvent);
          }
        } else if (currentSection === SECTIONS.SERIES) {
          // Navegação específica para séries - delegar todas as teclas
          if (keyCode === 38 || keyCode === 40 || keyCode === 37 || keyCode === 39 || keyCode === 13 || keyCode === 73 || keyCode === 80) {
            // Delegar navegação para o componente Series através de eventos customizados
            // keyCode 13 = ENTER para abrir tela de detalhes
            // keyCode 73 = Tecla 'I' para preview/detalhes
            // keyCode 80 = Tecla 'P' para reproduzir diretamente
            const seriesEvent = new CustomEvent('seriesNavigation', {
              detail: { keyCode }
            });
            window.dispatchEvent(seriesEvent);
          }
        } else if (currentSection === SECTIONS.SEARCH) {
          // Navegação específica para busca - delegar todas as teclas
          if (keyCode === 38 || keyCode === 40 || keyCode === 37 || keyCode === 39 || keyCode === 13) {
            // Delegar navegação para o componente Search através de eventos customizados
            const searchEvent = new CustomEvent('searchNavigation', {
              detail: { keyCode }
            });
            window.dispatchEvent(searchEvent);
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
        if (currentSection === SECTIONS.PLAYER) {
          // Voltar do player para a seção anterior
          handleBackFromPlayer();
        } else if (currentSection === SECTIONS.SERIES_DETAILS) {
          // Voltar da página de detalhes para a lista de séries
          setCurrentSection(SECTIONS.SERIES);
          setSelectedSeriesData(null);
        } else if (currentSection !== SECTIONS.HOME) {
          setCurrentSection(SECTIONS.HOME);
          setOnMenu(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection, onMenu, menuFocus, shelfFocus, itemFocus]);

  // Listener para eventos de reprodução de conteúdo
  useEffect(() => {
    const handlePlayContent = (event) => {
      const { streamUrl, streamInfo } = event.detail;
      setPlayerData({ streamUrl, streamInfo });
      setCurrentSection(SECTIONS.PLAYER);
    };

    window.addEventListener('playContent', handlePlayContent);
    return () => window.removeEventListener('playContent', handlePlayContent);
  }, []);

  // Listener para navegação para detalhes da série
  useEffect(() => {
    const handleShowSeriesDetails = (event) => {
      const { series } = event.detail;
      setSelectedSeriesData(series);
      setCurrentSection(SECTIONS.SERIES_DETAILS);
    };

    window.addEventListener('showSeriesDetails', handleShowSeriesDetails);
    return () => window.removeEventListener('showSeriesDetails', handleShowSeriesDetails);
  }, []);

  // Listener para evento de volta à sidebar
  useEffect(() => {
    const handleBackToSidebar = () => {
      setOnMenu(true);
    };

    window.addEventListener('backToSidebar', handleBackToSidebar);
    return () => window.removeEventListener('backToSidebar', handleBackToSidebar);
  }, []);

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

  const handleBackFromPlayer = () => {
    // Voltar para a última seção que não seja o player
    setCurrentSection(SECTIONS.HOME);
    setPlayerData({ streamUrl: '', streamInfo: null });
  };

  const handleBackFromSeriesDetails = () => {
    setCurrentSection(SECTIONS.SERIES);
    setSelectedSeriesData(null);
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

      case SECTIONS.CHANNELS:
        return <Channels isActive={currentSection === SECTIONS.CHANNELS} />;

      case SECTIONS.MOVIES:
        return <Movies isActive={currentSection === SECTIONS.MOVIES} />;

      case SECTIONS.SERIES:
        return <Series isActive={currentSection === SECTIONS.SERIES} />;

      case SECTIONS.SERIES_DETAILS:
        return (
          <SeriesDetailsPage 
            series={selectedSeriesData}
            isActive={currentSection === SECTIONS.SERIES_DETAILS}
            onBack={handleBackFromSeriesDetails}
          />
        );

      case SECTIONS.SEARCH:
        return <Search isActive={currentSection === SECTIONS.SEARCH} />;

      case SECTIONS.PLAYER:
        return (
          <VideoPlayer 
            isActive={currentSection === SECTIONS.PLAYER}
            streamUrl={playerData.streamUrl}
            streamInfo={playerData.streamInfo}
            onBack={handleBackFromPlayer}
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

  // Não mostrar sidebar na tela de login, no player ou na página de detalhes
  const showSidebar = currentSection !== SECTIONS.LOGIN && 
                     currentSection !== SECTIONS.PLAYER && 
                     currentSection !== SECTIONS.SERIES_DETAILS;

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

