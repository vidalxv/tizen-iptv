import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './SeriesDetailsPage.css';

const SeriesDetailsPage = ({ series, isActive, onBack }) => {
  const [focusedElement, setFocusedElement] = useState('play');
  const [isFavorite, setIsFavorite] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(0);
  const [focusArea, setFocusArea] = useState('actions'); // 'actions', 'tabs', 'seasons', 'episodes'
  const [seasonFocus, setSeasonFocus] = useState(0);
  const [episodeFocus, setEpisodeFocus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [episodesAreaExpanded, setEpisodesAreaExpanded] = useState(false); // Novo estado para controlar expansão

  // Referencias para navegação com foco
  const actionButtonsRef = useRef([]);
  const seasonElementsRef = useRef([]);
  const episodeElementsRef = useRef([]);
  const autoLoadTimeoutRef = useRef(null); // Ref para controlar timeout do carregamento automático

  // Memoizar actionElements para evitar recriação a cada render
  const actionElements = useMemo(() => ['play', 'favorite'], []);
  
  const API_BASE_URL = 'https://rota66.bar/player_api.php';
  const API_CREDENTIALS = 'username=zBB82J&password=AMeDHq';

  // Mover loadEpisodes antes de selectSeason para resolver dependência
  const loadEpisodes = useCallback(async (seasonNumber) => {
    console.log('📥 loadEpisodes chamada para temporada:', seasonNumber);
    
    try {
      setLoading(true);
      console.log('🌐 Fazendo requisição para API...');
      
      const response = await fetch(
        `${API_BASE_URL}?${API_CREDENTIALS}&action=get_series_info&series_id=${series.series_id}`
      );
      const data = await response.json();
      
      console.log('📊 Dados recebidos da API:', data);
      
      if (data.episodes && data.episodes[seasonNumber]) {
        console.log('✅ Episódios encontrados para temporada', seasonNumber, ':', data.episodes[seasonNumber].length);
        setEpisodes(data.episodes[seasonNumber]);
        setSelectedEpisode(0);
        setEpisodeFocus(0);
        // Automaticamente expandir e navegar para a área de episódios após carregar
        setEpisodesAreaExpanded(true);
        setTimeout(() => {
          setFocusArea('episodes');
        }, 100); // Pequeno delay para garantir que os episódios foram renderizados
      } else {
        console.log('⚠️ Nenhum episódio encontrado para temporada:', seasonNumber);
        setEpisodes([]);
        // Mesmo sem episódios, permitir navegação para área de episódios
        setEpisodesAreaExpanded(true);
        setTimeout(() => {
          setFocusArea('episodes');
        }, 100);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar episódios:', error);
      setEpisodes([]);
      // Em caso de erro, ainda permitir navegação
      setEpisodesAreaExpanded(true);
      setTimeout(() => {
        setFocusArea('episodes');
      }, 100);
    } finally {
      console.log('🏁 Finalizando carregamento de episódios');
      setLoading(false);
    }
  }, [series.series_id, API_BASE_URL, API_CREDENTIALS]);

  const selectSeason = useCallback((seasonNumber) => {
    console.log('🎯 selectSeason chamada com temporada:', seasonNumber, 'atual:', selectedSeason);
    
    // Evitar carregamento desnecessário se a temporada já estiver selecionada
    if (selectedSeason === seasonNumber) {
      console.log('⚠️ Temporada já selecionada, pulando carregamento');
      return;
    }
    
    console.log('✅ Iniciando carregamento da temporada:', seasonNumber);
    
    // Limpar timeout anterior se existir
    if (autoLoadTimeoutRef.current) {
      clearTimeout(autoLoadTimeoutRef.current);
    }
    
    setSelectedSeason(seasonNumber);
    const seasonIndex = seasons.findIndex(s => s.season_number === seasonNumber);
    setSeasonFocus(seasonIndex);
    loadEpisodes(seasonNumber);
  }, [selectedSeason, seasons, loadEpisodes]);

  // Funções de navegação refatoradas com useCallback
  const handleUpNavigation = useCallback(() => {
    if (focusArea === 'episodes') {
      // Na área de episódios (carrossel), seta para cima vai para temporadas ou ações
      if (seasons.length > 0) {
        setFocusArea('seasons');
        setSeasonFocus(seasonFocus);
      } else {
        setFocusArea('actions');
        setFocusedElement('play');
        setEpisodesAreaExpanded(false); // Recolher área ao sair dos episódios
      }
    } else if (focusArea === 'seasons') {
      if (seasonFocus > 0) {
        setSeasonFocus(seasonFocus - 1);
      } else {
        setFocusArea('actions');
        setFocusedElement('play');
        setEpisodesAreaExpanded(false); // Recolher área ao sair das temporadas
      }
    } else if (focusArea === 'actions') {
      // Já no topo, não faz nada
    }
  }, [focusArea, seasons.length, seasonFocus]);

  const handleDownNavigation = useCallback(() => {
    if (focusArea === 'actions') {
      // Ir direto para temporadas ou episódios, pulando as abas
      if (seasons.length > 0) {
        setFocusArea('seasons');
        setSeasonFocus(0);
        setEpisodesAreaExpanded(true); // Expandir área ao navegar para baixo
      } else {
        setFocusArea('episodes');
        setEpisodeFocus(0);
        setEpisodesAreaExpanded(true); // Expandir área ao navegar para baixo
      }
    } else if (focusArea === 'seasons') {
      // Sempre permitir navegar para episódios, independente se há episódios carregados
      setFocusArea('episodes');
      setEpisodeFocus(0);
    } else if (focusArea === 'episodes') {
      // No carrossel horizontal, seta para baixo não faz nada (sem navegação vertical)
      // Mantém o foco no episódio atual
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
        
        // Carregamento imediato - removido delay para debug
        const season = seasons[newSeasonFocus];
        if (season) {
          console.log('🔄 Carregando temporada automaticamente:', season.season_number);
          selectSeason(season.season_number);
        }
      } else {
        // Ir para a última temporada (navegação circular)
        const newSeasonFocus = seasons.length - 1;
        setSeasonFocus(newSeasonFocus);
        
        // Cancelar timeout anterior se existir
        if (autoLoadTimeoutRef.current) {
          clearTimeout(autoLoadTimeoutRef.current);
        }
        
        // Carregamento imediato - removido delay para debug
        const season = seasons[newSeasonFocus];
        if (season) {
          console.log('🔄 Carregando temporada automaticamente:', season.season_number);
          selectSeason(season.season_number);
        }
      }
    } else if (focusArea === 'episodes') {
      // Navegação horizontal para esquerda no carrossel
      if (episodeFocus > 0) {
        const newFocus = episodeFocus - 1;
        setEpisodeFocus(newFocus);
        
        // Scroll automático para o episódio focado
        setTimeout(() => {
          if (episodeElementsRef.current[newFocus]) {
            episodeElementsRef.current[newFocus].scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest',
              inline: 'center'
            });
          }
        }, 50);
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
        
        // Cancelar timeout anterior se existir
        if (autoLoadTimeoutRef.current) {
          clearTimeout(autoLoadTimeoutRef.current);
        }
        
        // Carregamento imediato - removido delay para debug
        const season = seasons[newSeasonFocus];
        if (season) {
          console.log('🔄 Carregando temporada automaticamente:', season.season_number);
          selectSeason(season.season_number);
        }
      } else {
        // Ir para a primeira temporada (navegação circular)
        const newSeasonFocus = 0;
        setSeasonFocus(newSeasonFocus);
        
        // Cancelar timeout anterior se existir
        if (autoLoadTimeoutRef.current) {
          clearTimeout(autoLoadTimeoutRef.current);
        }
        
        // Carregamento imediato - removido delay para debug
        const season = seasons[newSeasonFocus];
        if (season) {
          console.log('🔄 Carregando temporada automaticamente:', season.season_number);
          selectSeason(season.season_number);
        }
      }
    } else if (focusArea === 'episodes') {
      // Navegação horizontal para direita no carrossel
      if (episodeFocus < episodes.length - 1) {
        const newFocus = episodeFocus + 1;
        setEpisodeFocus(newFocus);
        
        // Scroll automático para o episódio focado
        setTimeout(() => {
          if (episodeElementsRef.current[newFocus]) {
            episodeElementsRef.current[newFocus].scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest',
              inline: 'center'
            });
          }
        }, 50);
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

  // Função de ação refatorada com useCallback
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
    } else if (focusArea === 'episodes' && episodes.length === 0) {
      console.log('Nenhum episódio disponível para esta temporada');
    }
  }, [focusArea, focusedElement, episodes, episodeFocus, selectedEpisode, playEpisode, loadFirstEpisode, toggleFavorite]);

  // Função para lidar com o botão voltar
  const handleBackNavigation = useCallback(() => {
    if (episodesAreaExpanded && (focusArea === 'episodes' || focusArea === 'seasons')) {
      // Se a área de episódios está expandida e estamos nela, apenas encolher
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

  // Função para atualizar foco visual e scroll automático
  const updateFocusVisual = useCallback(() => {
    // Remover foco de todos os elementos
    document.querySelectorAll('.primary-action-btn, .secondary-action-btn, .season-number-item, .episode-card-new').forEach(el => {
      el.classList.remove('focused');
    });

    // Adicionar foco ao elemento atual e fazer scroll
    if (focusArea === 'actions') {
      const buttonIndex = actionElements.indexOf(focusedElement);
      if (actionButtonsRef.current[buttonIndex]) {
        actionButtonsRef.current[buttonIndex].classList.add('focused');
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
  }, [focusArea, focusedElement, seasonFocus, episodeFocus, actionElements]);

  // useEffect para atualizar foco visual sempre que a navegação mudar
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

  // useEffect para NAVEGAÇÃO - separado da inicialização
  useEffect(() => {
    if (!isActive || !series) return;

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
          handleBackNavigation(); // Usar nova função de navegação de volta
          break;
        
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Limpar timeout ao desmontar componente
      if (autoLoadTimeoutRef.current) {
        clearTimeout(autoLoadTimeoutRef.current);
      }
    };
    // DEPENDÊNCIAS APENAS DA NAVEGAÇÃO - sem loadSeriesInfo
  }, [
    isActive,
    series,
    handleBackNavigation, // Atualizar dependência
    handleUpNavigation,
    handleDownNavigation, 
    handleLeftNavigation,
    handleRightNavigation,
    handleAction
  ]);

  if (!isActive || !series) return null;

  return (
    <div className="series-details-page">
      {/* Indicador de Navegação */}
      <div className="navigation-indicator">
        <div className="nav-indicator-content">
          <span className="nav-area-label">
            {focusArea === 'actions' && 'Ações'}
            {focusArea === 'seasons' && 'Temporadas'}
            {focusArea === 'episodes' && 'Episódios'}
          </span>
          <div className="nav-help">
            <span>↑↓←→ Navegar</span>
            <span>ENTER Selecionar</span>
            <span>VOLTAR {episodesAreaExpanded && (focusArea === 'episodes' || focusArea === 'seasons') ? 'Encolher' : 'Sair'}</span>
          </div>
        </div>
      </div>

      {/* Layout Principal */}
      <div className={`series-main-layout ${episodesAreaExpanded ? 'episodes-focused' : ''}`}>
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
        {/* Conteúdo dos Episódios - Removida a barra de navegação */}
        <div className="tab-content active">
          <div className="episodes-tab-content">
            {loading && (
              <div className="loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Carregando informações da série...</span>
              </div>
            )}
            
            {!loading && (
              <>
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