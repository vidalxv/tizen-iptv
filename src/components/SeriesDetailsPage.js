import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './SeriesDetailsPage.css';

const SeriesDetailsPage = ({ series, isActive, onBack }) => {
  const [focusedElement, setFocusedElement] = useState('play');
  const [isFavorite, setIsFavorite] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(0);
  const [focusArea, setFocusArea] = useState('actions');
  const [seasonFocus, setSeasonFocus] = useState(0);
  const [episodeFocus, setEpisodeFocus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [episodesAreaExpanded, setEpisodesAreaExpanded] = useState(false);

  // Referencias para navegação com foco
  const actionButtonsRef = useRef([]);
  const seasonElementsRef = useRef([]);
  const episodeElementsRef = useRef([]);
  const autoLoadTimeoutRef = useRef(null);

  // Memoizar actionElements para evitar recriação a cada render
  const actionElements = useMemo(() => ['play', 'favorite'], []);
  
  const API_BASE_URL = 'https://rota66.bar/player_api.php';
  const API_CREDENTIALS = 'username=zBB82J&password=AMeDHq';

  // Função otimizada para carregar episódios
  const loadEpisodes = useCallback(async (seasonNumber) => {
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
        // Expandir área de episódios automaticamente
        setEpisodesAreaExpanded(true);
        // Usar requestAnimationFrame para melhor performance
        requestAnimationFrame(() => {
          setFocusArea('episodes');
        });
      } else {
        setEpisodes([]);
        setEpisodesAreaExpanded(true);
        requestAnimationFrame(() => {
          setFocusArea('episodes');
        });
      }
    } catch (error) {
      console.error('Erro ao carregar episódios:', error);
      setEpisodes([]);
      setEpisodesAreaExpanded(true);
      requestAnimationFrame(() => {
        setFocusArea('episodes');
      });
    } finally {
      setLoading(false);
    }
  }, [series.series_id, API_BASE_URL, API_CREDENTIALS]);

  const selectSeason = useCallback((seasonNumber) => {
    // Evitar carregamento desnecessário se a temporada já estiver selecionada
    if (selectedSeason === seasonNumber) {
      return;
    }
    
    // Limpar timeout anterior se existir
    if (autoLoadTimeoutRef.current) {
      clearTimeout(autoLoadTimeoutRef.current);
    }
    
    setSelectedSeason(seasonNumber);
    const seasonIndex = seasons.findIndex(s => s.season_number === seasonNumber);
    setSeasonFocus(seasonIndex);
    loadEpisodes(seasonNumber);
  }, [selectedSeason, seasons, loadEpisodes]);

  // Funções de navegação otimizadas
  const handleUpNavigation = useCallback(() => {
    if (focusArea === 'episodes') {
      if (seasons.length > 0) {
        setFocusArea('seasons');
        setSeasonFocus(seasonFocus);
      } else {
        setFocusArea('actions');
        setFocusedElement('play');
        setEpisodesAreaExpanded(false);
      }
    } else if (focusArea === 'seasons') {
      if (seasonFocus > 0) {
        setSeasonFocus(seasonFocus - 1);
      } else {
        setFocusArea('actions');
        setFocusedElement('play');
        setEpisodesAreaExpanded(false);
      }
    }
  }, [focusArea, seasons.length, seasonFocus]);

  const handleDownNavigation = useCallback(() => {
    if (focusArea === 'actions') {
      if (seasons.length > 0) {
        setFocusArea('seasons');
        setSeasonFocus(0);
        setEpisodesAreaExpanded(true);
      } else {
        setFocusArea('episodes');
        setEpisodeFocus(0);
        setEpisodesAreaExpanded(true);
      }
    } else if (focusArea === 'seasons') {
      setFocusArea('episodes');
      setEpisodeFocus(0);
    }
  }, [focusArea, seasons.length]);

  const handleLeftNavigation = useCallback(() => {
    if (focusArea === 'actions') {
      const currentIndex = actionElements.indexOf(focusedElement);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : actionElements.length - 1;
      setFocusedElement(actionElements[prevIndex]);
    } else if (focusArea === 'seasons') {
      if (seasonFocus > 0) {
        const newSeasonFocus = seasonFocus - 1;
        setSeasonFocus(newSeasonFocus);
        
        // Cancelar timeout anterior se existir
        if (autoLoadTimeoutRef.current) {
          clearTimeout(autoLoadTimeoutRef.current);
        }
        
        // Carregamento imediato da temporada
        const season = seasons[newSeasonFocus];
        if (season) {
          selectSeason(season.season_number);
        }
      } else {
        // Navegação circular para a última temporada
        const newSeasonFocus = seasons.length - 1;
        setSeasonFocus(newSeasonFocus);
        
        if (autoLoadTimeoutRef.current) {
          clearTimeout(autoLoadTimeoutRef.current);
        }
        
        const season = seasons[newSeasonFocus];
        if (season) {
          selectSeason(season.season_number);
        }
      }
    } else if (focusArea === 'episodes') {
      // Navegação horizontal para esquerda no carrossel
      if (episodeFocus > 0) {
        const newFocus = episodeFocus - 1;
        setEpisodeFocus(newFocus);
        
        // Scroll otimizado usando requestAnimationFrame
        requestAnimationFrame(() => {
          if (episodeElementsRef.current[newFocus]) {
            episodeElementsRef.current[newFocus].scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest',
              inline: 'center'
            });
          }
        });
      }
    }
  }, [focusArea, focusedElement, seasonFocus, seasons, episodeFocus, actionElements, selectSeason]);

  const handleRightNavigation = useCallback(() => {
    if (focusArea === 'actions') {
      const currentIndex = actionElements.indexOf(focusedElement);
      const nextIndex = currentIndex < actionElements.length - 1 ? currentIndex + 1 : 0;
      setFocusedElement(actionElements[nextIndex]);
    } else if (focusArea === 'seasons') {
      if (seasonFocus < seasons.length - 1) {
        const newSeasonFocus = seasonFocus + 1;
        setSeasonFocus(newSeasonFocus);
        
        if (autoLoadTimeoutRef.current) {
          clearTimeout(autoLoadTimeoutRef.current);
        }
        
        const season = seasons[newSeasonFocus];
        if (season) {
          selectSeason(season.season_number);
        }
      } else {
        // Navegação circular para a primeira temporada
        const newSeasonFocus = 0;
        setSeasonFocus(newSeasonFocus);
        
        if (autoLoadTimeoutRef.current) {
          clearTimeout(autoLoadTimeoutRef.current);
        }
        
        const season = seasons[newSeasonFocus];
        if (season) {
          selectSeason(season.season_number);
        }
      }
    } else if (focusArea === 'episodes') {
      // Navegação horizontal para direita no carrossel
      if (episodeFocus < episodes.length - 1) {
        const newFocus = episodeFocus + 1;
        setEpisodeFocus(newFocus);
        
        // Scroll otimizado usando requestAnimationFrame
        requestAnimationFrame(() => {
          if (episodeElementsRef.current[newFocus]) {
            episodeElementsRef.current[newFocus].scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest',
              inline: 'center'
            });
          }
        });
      }
    }
  }, [focusArea, focusedElement, seasonFocus, seasons, episodeFocus, episodes.length, actionElements, selectSeason]);

  const playEpisode = useCallback((episode) => {
    const playEvent = new CustomEvent('playContent', {
      detail: {
        streamUrl: `https://rota66.bar/series/zBB82J/AMeDHq/${episode.id || episode.stream_id}.mp4`,
        streamInfo: {
          name: `${series.name} - S${String(selectedSeason).padStart(2, '0')}E${String(episode.episode_num || 1).padStart(2, '0')} - ${episode.title || episode.name || 'Episódio'}`,
          type: 'series',
          category: series.category_name || 'Série',
          description: episode.plot || episode.info?.plot || series.plot || 'Descrição não disponível',
          year: series.releasedate || 'N/A',
          rating: series.rating || episode.rating || 'N/A',
          poster: series.cover || series.stream_icon
        }
      }
    });
    window.dispatchEvent(playEvent);
  }, [series, selectedSeason]);

  const loadFirstEpisode = useCallback(async () => {
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
  }, [series.series_id, playEpisode, API_BASE_URL, API_CREDENTIALS]);

  const toggleFavorite = useCallback(() => {
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
  }, [series, isFavorite]);

  // Função de ação otimizada
  const handleAction = useCallback(() => {
    if (focusArea === 'actions') {
      switch (focusedElement) {
        case 'play':
          if (episodes.length > 0 && episodes[selectedEpisode]) {
            playEpisode(episodes[selectedEpisode]);
          } else {
            loadFirstEpisode();
          }
          break;
        case 'favorite':
          toggleFavorite();
          break;
        default:
          break;
      }
    } else if (focusArea === 'episodes' && episodes[episodeFocus]) {
      const episode = episodes[episodeFocus];
      setSelectedEpisode(episodeFocus);
      playEpisode(episode);
    }
  }, [focusArea, focusedElement, episodes, episodeFocus, selectedEpisode, playEpisode, loadFirstEpisode, toggleFavorite]);

  // Função para lidar com o botão voltar
  const handleBackNavigation = useCallback(() => {
    if (episodesAreaExpanded && (focusArea === 'episodes' || focusArea === 'seasons')) {
      // Se a área de episódios está expandida, apenas encolher
      setEpisodesAreaExpanded(false);
      setFocusArea('actions');
      setFocusedElement('play');
    } else {
      // Caso contrário, voltar para a tela anterior
      onBack();
    }
  }, [episodesAreaExpanded, focusArea, onBack]);

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
  }, [series?.series_id, API_BASE_URL, API_CREDENTIALS]);

  // Função otimizada para atualizar foco visual
  const updateFocusVisual = useCallback(() => {
    // Usar requestAnimationFrame para melhor performance
    requestAnimationFrame(() => {
      // Remover foco de todos os elementos
      document.querySelectorAll('.primary-action-btn, .secondary-action-btn, .season-number-item, .episode-card-new').forEach(el => {
        el.classList.remove('focused');
      });

      // Adicionar foco ao elemento atual
      if (focusArea === 'actions') {
        const buttonIndex = actionElements.indexOf(focusedElement);
        if (actionButtonsRef.current[buttonIndex]) {
          actionButtonsRef.current[buttonIndex].classList.add('focused');
          // Scroll suave otimizado
          actionButtonsRef.current[buttonIndex].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',
            inline: 'nearest'
          });
        }
      } else if (focusArea === 'seasons' && seasonElementsRef.current[seasonFocus]) {
        seasonElementsRef.current[seasonFocus].classList.add('focused');
        seasonElementsRef.current[seasonFocus].scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      } else if (focusArea === 'episodes' && episodeElementsRef.current[episodeFocus]) {
        episodeElementsRef.current[episodeFocus].classList.add('focused');
        episodeElementsRef.current[episodeFocus].scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }
    });
  }, [focusArea, focusedElement, seasonFocus, episodeFocus, actionElements]);

  // useEffect para atualizar foco visual
  useEffect(() => {
    updateFocusVisual();
  }, [updateFocusVisual]);

  // useEffect para INICIALIZAÇÃO - executa apenas uma vez quando componente ativa
  useEffect(() => {
    if (!isActive || !series) return;

    // Inicializar estado apenas na primeira vez
    setFocusedElement('play');
    setFocusArea('actions');
    
    // Verificar se é favorito
    const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
    const seriesKey = `series_${series.series_id}`;
    setIsFavorite(!!favorites[seriesKey]);
    
    // Carregar informações da série
    loadSeriesInfo();
  }, [isActive, series, loadSeriesInfo]);

  // useEffect para NAVEGAÇÃO - otimizado
  useEffect(() => {
    if (!isActive || !series) return;

    // Criar uma referência local do timeout para o cleanup
    const currentTimeoutRef = autoLoadTimeoutRef.current;

    const handleKeyDown = (event) => {
      // Prevenir comportamento padrão para melhor performance
      event.preventDefault();
      
      switch (event.key) {
        case 'ArrowUp':
          handleUpNavigation();
          break;
        
        case 'ArrowDown':
          handleDownNavigation();
          break;
        
        case 'ArrowLeft':
          handleLeftNavigation();
          break;
        
        case 'ArrowRight':
          handleRightNavigation();
          break;
        
        case 'Enter':
        case ' ':
          handleAction();
          break;
        
        case 'Escape':
        case 'Backspace':
          handleBackNavigation();
          break;
        
        default:
          // Permitir comportamento padrão para outras teclas
          return;
      }
    };

    document.addEventListener('keydown', handleKeyDown, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Limpar timeout ao desmontar componente usando a referência local
      if (currentTimeoutRef) {
        clearTimeout(currentTimeoutRef);
      }
    };
  }, [
    isActive,
    series,
    handleBackNavigation,
    handleUpNavigation,
    handleDownNavigation, 
    handleLeftNavigation,
    handleRightNavigation,
    handleAction
  ]);

  if (!isActive || !series) return null;

  return (
    <div className="series-details-page">
      {/* Layout Principal */}
      <div className={`series-main-layout ${episodesAreaExpanded ? 'episodes-focused' : ''}`}>
        {/* Painel de Informações (Esquerda) */}
        <div className={`series-info-panel ${episodes.length > 0 ? 'has-episodes' : ''}`}>
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
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              <h1 className="series-title-main">{series.name}</h1>
            </div>
            
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
            <p className="synopsis-text expanded">
              {series.plot || 'Descrição não disponível para esta série.'}
            </p>
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
              onClick={() => {
                if (episodes.length > 0 && episodes[selectedEpisode]) {
                  playEpisode(episodes[selectedEpisode]);
                } else {
                  loadFirstEpisode();
                }
              }}
              ref={(el) => (actionButtonsRef.current[0] = el)}
            >
              <i className="fas fa-play"></i>
              Assistir T1 Ep. 1
            </button>
            
            <button 
              className={`secondary-action-btn ${focusArea === 'actions' && focusedElement === 'favorite' ? 'focused' : ''}`}
              onClick={() => toggleFavorite()}
              ref={(el) => (actionButtonsRef.current[1] = el)}
            >
              <i className={`fas ${isFavorite ? 'fa-heart' : 'fa-plus'}`}></i>
              {isFavorite ? 'Na Minha Lista' : 'Minha Lista'}
            </button>
          </div>

          {/* Indicador de navegação integrado */}
          {episodes.length > 0 && !episodesAreaExpanded && focusArea === 'actions' && (
            <div className="episodes-navigation-hint">
              <i className="fas fa-arrow-down"></i>
              <span>Pressione ↓ para ver todos os episódios</span>
            </div>
          )}
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

      {/* Nova Área de Episódios */}
      <div className={`series-episodes-area ${episodesAreaExpanded ? 'episodes-focused' : ''}`}>
        <div className="tab-content active">
          <div className="episodes-tab-content">
            {loading && (
              <div className="loading">
                <i className="fas fa-spinner"></i>
                <span>Carregando informações da série...</span>
              </div>
            )}
            
            {!loading && (
              <>
                {/* Cabeçalho da Seção de Episódios */}
                <div className="episodes-section-header">
                  <h2 className="episodes-section-title">Episódios</h2>
                  <p className="episodes-section-subtitle">
                    {episodes.length > 0 
                      ? `Temporada ${selectedSeason} • ${episodes.length} episódio${episodes.length !== 1 ? 's' : ''}`
                      : 'Carregando episódios...'
                    }
                  </p>
                </div>

                {/* Seletor de Temporadas */}
                {seasons.length > 0 && (
                  <div className="season-selector-hbo">
                    <span className="season-title-fixed">Temporada</span>
                    <div className="season-numbers-container">
                      {seasons.map((season, index) => (
                        <div
                          key={season.season_number}
                          className={`season-number-item ${
                            selectedSeason === season.season_number ? 'active' : ''
                          } ${
                            focusArea === 'seasons' && seasonFocus === index ? 'focused' : ''
                          }`}
                          onClick={() => selectSeason(season.season_number)}
                          ref={(el) => (seasonElementsRef.current[index] = el)}
                        >
                          {season.season_number}
                        </div>
                      ))}
                      <div className="season-indicator-bar"></div>
                    </div>
                  </div>
                )}
                
                {/* Grade de Episódios */}
                <div className="episodes-grid-container">
                  {episodes.length > 0 ? (
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
                          ref={(el) => (episodeElementsRef.current[index] = el)}
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
                  ) : (
                    <div className="no-episodes-message">
                      <i className="fas fa-film"></i>
                      <h3>Episódios em carregamento...</h3>
                      <p>Aguarde enquanto carregamos os episódios desta série.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesDetailsPage; 