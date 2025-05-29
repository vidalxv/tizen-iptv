import React, { useState, useEffect, useCallback } from 'react';
import './SeriesDetailsPage.css';

const SeriesDetailsPage = ({ series, isActive, onBack }) => {
  const [focusedElement, setFocusedElement] = useState('play');
  const [isFavorite, setIsFavorite] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(0);
  const [focusArea, setFocusArea] = useState('actions'); // 'actions', 'tabs', 'seasons', 'episodes'
  const [activeTab, setActiveTab] = useState(null); // null, 'episodes', 'related', 'extras'
  const [seasonFocus, setSeasonFocus] = useState(0);
  const [episodeFocus, setEpisodeFocus] = useState(0);
  const [tabFocus, setTabFocus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  const actionElements = ['play', 'favorite'];
  const tabElements = ['episodes', 'related', 'extras'];
  const API_BASE_URL = 'https://rota66.bar/player_api.php';
  const API_CREDENTIALS = 'username=zBB82J&password=AMeDHq';

  const handleUpNavigation = () => {
    if (focusArea === 'episodes') {
      if (episodeFocus > 0) {
        setEpisodeFocus(episodeFocus - 1);
      } else if (seasons.length > 0) {
        setFocusArea('seasons');
        setSeasonFocus(seasonFocus);
      } else {
        setFocusArea('tabs');
        setTabFocus(0);
      }
    } else if (focusArea === 'seasons') {
      if (seasonFocus > 0) {
        setSeasonFocus(seasonFocus - 1);
      } else {
        setFocusArea('tabs');
        setTabFocus(0);
      }
    } else if (focusArea === 'tabs') {
      setFocusArea('actions');
      setFocusedElement('play');
    } else if (focusArea === 'actions') {
      // Já no topo, não faz nada
    }
  };

  const handleDownNavigation = () => {
    if (focusArea === 'actions') {
      setFocusArea('tabs');
      setTabFocus(0);
      // Ativar a aba de episódios quando navegar para as abas
      if (activeTab === null) {
        setActiveTab('episodes');
      }
    } else if (focusArea === 'tabs') {
      if (activeTab === 'episodes') {
        if (seasons.length > 0) {
          setFocusArea('seasons');
          setSeasonFocus(0);
        } else if (episodes.length > 0) {
          setFocusArea('episodes');
          setEpisodeFocus(0);
        }
      }
    } else if (focusArea === 'seasons') {
      if (episodes.length > 0) {
        setFocusArea('episodes');
        setEpisodeFocus(0);
      }
    } else if (focusArea === 'episodes') {
      // Navegação circular nos episódios
      if (episodeFocus < episodes.length - 1) {
        setEpisodeFocus(episodeFocus + 1);
      }
    }
  };

  const handleLeftNavigation = () => {
    if (focusArea === 'actions') {
      const currentIndex = actionElements.indexOf(focusedElement);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : actionElements.length - 1;
      setFocusedElement(actionElements[prevIndex]);
    } else if (focusArea === 'tabs') {
      const prevIndex = tabFocus > 0 ? tabFocus - 1 : tabElements.length - 1;
      setTabFocus(prevIndex);
    } else if (focusArea === 'seasons' && seasonFocus > 0) {
      setSeasonFocus(seasonFocus - 1);
    } else if (focusArea === 'episodes') {
      // Navegação em grid (esquerda/direita)
      const currentRow = Math.floor(episodeFocus / 3); // Assumindo 3 colunas
      const currentCol = episodeFocus % 3;
      if (currentCol > 0) {
        setEpisodeFocus(episodeFocus - 1);
      }
    }
  };

  const handleRightNavigation = () => {
    if (focusArea === 'actions') {
      const currentIndex = actionElements.indexOf(focusedElement);
      const nextIndex = currentIndex < actionElements.length - 1 ? currentIndex + 1 : 0;
      setFocusedElement(actionElements[nextIndex]);
    } else if (focusArea === 'tabs') {
      const nextIndex = tabFocus < tabElements.length - 1 ? tabFocus + 1 : 0;
      setTabFocus(nextIndex);
    } else if (focusArea === 'seasons' && seasonFocus < seasons.length - 1) {
      setSeasonFocus(seasonFocus + 1);
    } else if (focusArea === 'episodes') {
      // Navegação em grid (esquerda/direita)
      const currentRow = Math.floor(episodeFocus / 3); // Assumindo 3 colunas
      const currentCol = episodeFocus % 3;
      const maxCol = Math.min(2, (episodes.length - currentRow * 3) - 1);
      if (currentCol < maxCol) {
        setEpisodeFocus(episodeFocus + 1);
      }
    }
  };

  const handleAction = () => {
    if (focusArea === 'actions') {
      switch (focusedElement) {
        case 'play':
          playSelectedEpisode();
          break;
        case 'favorite':
          toggleFavorite();
          break;
      }
    } else if (focusArea === 'tabs') {
      const selectedTab = tabElements[tabFocus];
      setActiveTab(selectedTab);
      // Se for episódios e houver temporadas, navegar para seletor de temporadas
      if (selectedTab === 'episodes' && seasons.length > 0) {
        setFocusArea('seasons');
        setSeasonFocus(0);
      } else if (selectedTab === 'episodes' && episodes.length > 0) {
        setFocusArea('episodes');
        setEpisodeFocus(0);
      }
    } else if (focusArea === 'seasons' && seasons[seasonFocus]) {
      const season = seasons[seasonFocus];
      selectSeason(season.season_number);
    } else if (focusArea === 'episodes' && episodes[episodeFocus]) {
      const episode = episodes[episodeFocus];
      setSelectedEpisode(episodeFocus);
      playEpisode(episode);
    }
  };

  const playSelectedEpisode = () => {
    if (episodes.length > 0 && episodes[selectedEpisode]) {
      playEpisode(episodes[selectedEpisode]);
    } else {
      loadFirstEpisode();
    }
  };

  const playEpisode = (episode) => {
    const playEvent = new CustomEvent('playContent', {
      detail: {
        streamUrl: `https://rota66.bar/series/zBB82J/AMeDHq/${episode.id || episode.stream_id}.mp4`,
        streamInfo: {
          name: `${series.name} - S${String(selectedSeason).padStart(2, '0')}E${String(episode.episode_num || 1).padStart(2, '0')} - ${episode.title || episode.name || 'Episódio'}`,
          type: 'series',
          category: series.category_name || 'Série',
          description: episode.plot || episode.info || series.plot || 'Descrição não disponível',
          year: series.releasedate || 'N/A',
          rating: series.rating || episode.rating || 'N/A',
          poster: series.cover || series.stream_icon
        }
      }
    });
    window.dispatchEvent(playEvent);
  };

  const loadFirstEpisode = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}?${API_CREDENTIALS}&action=get_series_info&series_id=${series.series_id}`
      );
      const data = await response.json();
      
      if (data.episodes && Object.keys(data.episodes).length > 0) {
        const firstSeason = Object.keys(data.episodes)[0];
        const firstEpisode = data.episodes[firstSeason][0];
        if (firstEpisode) {
          playEpisode(firstEpisode);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar primeiro episódio:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectSeason = (seasonNumber) => {
    setSelectedSeason(seasonNumber);
    const seasonIndex = seasons.findIndex(s => s.season_number === seasonNumber);
    setSeasonFocus(seasonIndex);
    loadEpisodes(seasonNumber);
  };

  const loadEpisodes = async (seasonNumber) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}?${API_CREDENTIALS}&action=get_series_info&series_id=${series.series_id}`
      );
      const data = await response.json();
      
      if (data.episodes && data.episodes[seasonNumber]) {
        setEpisodes(data.episodes[seasonNumber]);
        setSelectedEpisode(0);
        setEpisodeFocus(0);
      } else {
        setEpisodes([]);
      }
    } catch (error) {
      console.error('Erro ao carregar episódios:', error);
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
    const seriesKey = `series_${series.series_id}`;
    
    if (isFavorite) {
      delete favorites[seriesKey];
    } else {
      favorites[seriesKey] = {
        series_id: series.series_id,
        name: series.name,
        cover: series.cover,
        stream_icon: series.stream_icon,
        plot: series.plot,
        category_name: series.category_name,
        rating: series.rating,
        releasedate: series.releasedate,
        addedAt: new Date().toISOString()
      };
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
  };

  const loadSeriesInfo = useCallback(async () => {
    if (!series?.series_id) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}?${API_CREDENTIALS}&action=get_series_info&series_id=${series.series_id}`
      );
      const data = await response.json();
      
      if (data.seasons) {
        setSeasons(data.seasons);
        
        // Carregar episódios da primeira temporada automaticamente
        if (data.seasons.length > 0) {
          const firstSeason = data.seasons[0].season_number;
          setSelectedSeason(firstSeason);
          
          if (data.episodes && data.episodes[firstSeason]) {
            setEpisodes(data.episodes[firstSeason]);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar informações da série:', error);
    } finally {
      setLoading(false);
    }
  }, [series?.series_id]);

  // Sistema de navegação específico para a página de detalhes
  useEffect(() => {
    if (isActive && series) {
      const handleKeyDown = (event) => {
        switch (event.key) {
          case 'ArrowUp':
            event.preventDefault();
            handleUpNavigation();
            break;
          
          case 'ArrowDown':
            event.preventDefault();
            handleDownNavigation();
            break;
          
          case 'ArrowLeft':
            event.preventDefault();
            handleLeftNavigation();
            break;
          
          case 'ArrowRight':
            event.preventDefault();
            handleRightNavigation();
            break;
          
          case 'Enter':
          case ' ':
            event.preventDefault();
            handleAction();
            break;
          
          case 'Escape':
          case 'Backspace':
            event.preventDefault();
            onBack();
            break;
          
          default:
            break;
        }
      };

      // Escutar eventos do controle remoto da TV
      const handleSeriesDetailsNavigation = (event) => {
        const { keyCode } = event.detail;
        
        if (keyCode === 38) { // Cima
          handleUpNavigation();
        } else if (keyCode === 40) { // Baixo
          handleDownNavigation();
        } else if (keyCode === 37) { // Esquerda
          handleLeftNavigation();
        } else if (keyCode === 39) { // Direita
          handleRightNavigation();
        } else if (keyCode === 13) { // OK/Enter
          handleAction();
        } else if (keyCode === 10009 || keyCode === 8) { // Return/Back
          onBack();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('seriesDetailsNavigation', handleSeriesDetailsNavigation);
      
      // Inicializar estado
      setFocusedElement('play');
      setFocusArea('actions');
      
      // Verificar se é favorito
      const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
      const seriesKey = `series_${series.series_id}`;
      setIsFavorite(!!favorites[seriesKey]);
      
      // Carregar informações da série
      loadSeriesInfo();

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('seriesDetailsNavigation', handleSeriesDetailsNavigation);
      };
    }
  }, [isActive, series]);

  if (!isActive || !series) return null;

  return (
    <div className="series-details-page">
      {/* Layout Principal */}
      <div className="series-main-layout">
        {/* Container para painel de informações e arte promocional */}
        <div className="series-content-wrapper">
          {/* Painel de Informações (Esquerda) */}
          <div className="series-info-panel">
            <div className="series-header-info">
              {/* Logo do Provedor */}
              <img 
                src="/images/logo-provider.png" 
                alt="Provider Logo" 
                className="series-provider-logo"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              
              {/* Badge Novo Episódio */}
              <div className="new-episode-badge">
                Novo Episódio
              </div>
              
              {/* Título da Série */}
              <h1 className="series-title-main">{series.name}</h1>
              
              {/* Meta Informações */}
              <div className="series-meta-info">
                <div className="meta-item age-rating">
                  <i className="fas fa-shield-alt"></i>
                  <span>14+</span>
                </div>
                <div className="meta-item season-count">
                  <i className="fas fa-list"></i>
                  <span>{seasons.length} Temporadas</span>
                </div>
              </div>
            </div>
            
            {/* Sinopse */}
            <div className="series-synopsis">
              <p className={`synopsis-text ${synopsisExpanded ? 'expanded' : ''}`}>
                {series.plot || 'Descrição não disponível para esta série.'}
              </p>
              <span 
                className="synopsis-more"
                onClick={() => setSynopsisExpanded(!synopsisExpanded)}
              >
                {synopsisExpanded ? 'Menos' : 'Mais'}
              </span>
            </div>
            
            {/* Gêneros */}
            <div className="series-genres">
              <div className="genre-tag">Comédia</div>
              <div className="genre-tag">Animação</div>
              <div className="genre-tag">Adulto</div>
            </div>
            
            {/* Botões de Ação */}
            <div className="series-action-buttons">
              <button 
                className={`primary-action-btn ${focusArea === 'actions' && focusedElement === 'play' ? 'focused' : ''}`}
                onClick={() => playSelectedEpisode()}
              >
                <i className="fas fa-play"></i>
                Assistir T1 Ep. 1
              </button>
              
              <button 
                className={`secondary-action-btn ${focusArea === 'actions' && focusedElement === 'favorite' ? 'focused' : ''}`}
                onClick={() => toggleFavorite()}
              >
                <i className={`fas ${isFavorite ? 'fa-heart' : 'fa-plus'}`}></i>
                {isFavorite ? 'Na Minha Lista' : 'Minha Lista'}
              </button>
            </div>
          </div>
          
          {/* Arte Promocional (Direita) */}
          <div className="series-promotional-art">
            <img 
              src={series.backdrop_path?.[0] || series.cover || series.stream_icon} 
              alt={series.name}
              className="promotional-image"
              onError={(e) => {
                e.target.src = series.cover || series.stream_icon || '/images/placeholder-series.jpg';
              }}
            />
            <div className="promotional-overlay"></div>
          </div>
        </div>
        
        {/* Barra de Navegação */}
        <div className="series-navigation-bar">
          <div className="navigation-tabs">
            <button 
              className={`nav-tab ${activeTab === 'episodes' ? 'active' : ''} ${
                focusArea === 'tabs' && tabFocus === 0 ? 'focused' : ''
              }`}
              onClick={() => setActiveTab('episodes')}
            >
              Episódios
            </button>
            <button 
              className={`nav-tab ${activeTab === 'related' ? 'active' : ''} ${
                focusArea === 'tabs' && tabFocus === 1 ? 'focused' : ''
              }`}
              onClick={() => setActiveTab('related')}
            >
              Você também pode gostar
            </button>
            <button 
              className={`nav-tab ${activeTab === 'extras' ? 'active' : ''} ${
                focusArea === 'tabs' && tabFocus === 2 ? 'focused' : ''
              }`}
              onClick={() => setActiveTab('extras')}
            >
              Extras
            </button>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className={`tab-content ${activeTab === 'episodes' ? 'active' : ''}`}>
          <div className="episodes-tab-content">
            {loading ? (
              <div className="loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Carregando informações da série...</span>
              </div>
            ) : (
              <>
                {/* Seletor de Temporadas */}
                {seasons.length > 0 && (
                  <div className="season-selector">
                    {seasons.map((season, index) => (
                      <div
                        key={season.season_number}
                        className={`season-selector-item ${
                          selectedSeason === season.season_number ? 'active' : ''
                        } ${
                          focusArea === 'seasons' && seasonFocus === index ? 'focused' : ''
                        }`}
                        onClick={() => selectSeason(season.season_number)}
                      >
                        Temporada {season.season_number}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Grade de Episódios */}
                <div className="episodes-grid-container">
                  <div className="episodes-grid-new">
                    {episodes.map((episode, index) => (
                      <div
                        key={episode.id || index}
                        className={`episode-card-new ${
                          selectedEpisode === index ? 'active' : ''
                        } ${
                          focusArea === 'episodes' && episodeFocus === index ? 'focused' : ''
                        }`}
                        onClick={() => {
                          setSelectedEpisode(index);
                          playEpisode(episode);
                        }}
                      >
                        <div className="episode-thumbnail">
                          <img 
                            src={episode.info?.movie_image || series.cover || '/images/placeholder-episode.jpg'}
                            alt={episode.title || episode.name || 'Episode'}
                            onError={(e) => {
                              e.target.src = '/images/placeholder-episode.jpg';
                            }}
                          />
                          <div className="episode-play-overlay">
                            <i className="fas fa-play"></i>
                          </div>
                        </div>
                        
                        <div className="episode-details">
                          <div className="episode-header">
                            <div className="episode-number-badge">
                              E{String(episode.episode_num || index + 1).padStart(2, '0')}
                            </div>
                            <span className="episode-duration">22 min</span>
                          </div>
                          
                          <h4 className="episode-title-new">
                            {episode.title || episode.name || `Episódio ${episode.episode_num || index + 1}`}
                          </h4>
                          
                          <div className="episode-meta">
                            <span>2023</span>
                            <span>14+</span>
                          </div>
                          
                          {episode.plot && (
                            <p className="episode-description-new">{episode.plot}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Conteúdo para outras abas */}
        <div className={`tab-content ${activeTab === 'related' ? 'active' : ''}`}>
          <div className="episodes-tab-content">
            <h2>Você também pode gostar</h2>
            <p>Conteúdo relacionado em desenvolvimento...</p>
          </div>
        </div>
        
        <div className={`tab-content ${activeTab === 'extras' ? 'active' : ''}`}>
          <div className="episodes-tab-content">
            <h2>Extras</h2>
            <p>Conteúdo extra em desenvolvimento...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesDetailsPage; 