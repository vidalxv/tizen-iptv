import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  // Referencias para navegação com foco
  const actionButtonsRef = useRef([]);
  const seasonElementsRef = useRef([]);
  const episodeElementsRef = useRef([]);

  const actionElements = ['play', 'favorite'];
  const API_BASE_URL = 'https://rota66.bar/player_api.php';
  const API_CREDENTIALS = 'username=zBB82J&password=AMeDHq';

  // Função para calcular o número de colunas no grid dinamicamente
  const getGridColumns = useCallback(() => {
    // Por enquanto, vamos usar valor fixo mais comum até o problema ser resolvido
    // Baseado na análise do CSS: minmax(240px, 1fr) em tela padrão ~1920px = ~6-7 colunas
    const containerWidth = window.innerWidth * 0.65; // 65% para a área de episódios
    const episodeMinWidth = 240 + 16; // 240px + gap
    const estimatedColumns = Math.floor(containerWidth / episodeMinWidth);
    const columns = Math.max(3, Math.min(6, estimatedColumns)); // Entre 3 e 6 colunas
    
    console.log('Grid Columns Debug:', {
      containerWidth,
      episodeMinWidth,
      estimatedColumns,
      finalColumns: columns,
      windowWidth: window.innerWidth
    });
    
    return columns;
  }, []);

  // Funções de navegação refatoradas com useCallback
  const handleUpNavigation = useCallback(() => {
    if (focusArea === 'episodes') {
      // Navegação vertical para cima nos episódios
      const episodesPerRow = getGridColumns();
      const currentRow = Math.floor(episodeFocus / episodesPerRow);
      const currentCol = episodeFocus % episodesPerRow;
      
      console.log('Up Navigation Debug:', {
        currentFocus: episodeFocus,
        episodesPerRow,
        currentRow,
        currentCol,
        totalEpisodes: episodes.length
      });
      
      // Se estamos na primeira linha, ir para temporadas ou ações
      if (currentRow === 0) {
        if (seasons.length > 0) {
          setFocusArea('seasons');
          setSeasonFocus(seasonFocus);
        } else {
          setFocusArea('actions');
          setFocusedElement('play');
        }
      } else {
        // Ir para a linha de cima, mesma coluna
        const targetEpisode = episodeFocus - episodesPerRow;
        console.log('Moving up to episode:', targetEpisode);
        setEpisodeFocus(targetEpisode);
      }
    } else if (focusArea === 'seasons') {
      if (seasonFocus > 0) {
        setSeasonFocus(seasonFocus - 1);
      } else {
        setFocusArea('actions');
        setFocusedElement('play');
      }
    } else if (focusArea === 'actions') {
      // Já no topo, não faz nada
    }
  }, [focusArea, episodeFocus, seasons.length, seasonFocus, getGridColumns, episodes.length]);

  const handleDownNavigation = useCallback(() => {
    if (focusArea === 'actions') {
      // Ir direto para temporadas ou episódios, pulando as abas
      if (seasons.length > 0) {
        setFocusArea('seasons');
        setSeasonFocus(0);
      } else {
        setFocusArea('episodes');
        setEpisodeFocus(0);
      }
    } else if (focusArea === 'seasons') {
      // Sempre permitir navegar para episódios, independente se há episódios carregados
      setFocusArea('episodes');
      setEpisodeFocus(0);
    } else if (focusArea === 'episodes') {
      // Navegação vertical nos episódios
      const episodesPerRow = getGridColumns();
      const currentRow = Math.floor(episodeFocus / episodesPerRow);
      const currentCol = episodeFocus % episodesPerRow;
      const totalRows = Math.ceil(episodes.length / episodesPerRow);
      
      console.log('Down Navigation Debug:', {
        currentFocus: episodeFocus,
        episodesPerRow,
        currentRow,
        currentCol,
        totalRows,
        totalEpisodes: episodes.length
      });
      
      // Se não estamos na última linha, ir para baixo
      if (currentRow < totalRows - 1) {
        const targetEpisode = episodeFocus + episodesPerRow;
        // Verificar se o episódio de destino existe
        if (targetEpisode < episodes.length) {
          console.log('Moving down to episode:', targetEpisode);
          setEpisodeFocus(targetEpisode);
        } else {
          // Se não existe, ir para o último episódio da última linha
          console.log('Target episode does not exist, going to last episode:', episodes.length - 1);
          setEpisodeFocus(episodes.length - 1);
        }
      }
      // Se já estamos na última linha, não fazer nada
    }
  }, [focusArea, seasons.length, episodeFocus, episodes.length, getGridColumns]);

  const handleLeftNavigation = useCallback(() => {
    if (focusArea === 'actions') {
      const currentIndex = actionElements.indexOf(focusedElement);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : actionElements.length - 1;
      setFocusedElement(actionElements[prevIndex]);
    } else if (focusArea === 'seasons') {
      if (seasonFocus > 0) {
        setSeasonFocus(seasonFocus - 1);
      } else {
        // Ir para a última temporada (navegação circular)
        setSeasonFocus(seasons.length - 1);
      }
    } else if (focusArea === 'episodes') {
      // Navegação horizontal para esquerda - simples sequencial
      console.log('Left Navigation:', {
        currentFocus: episodeFocus,
        canGoLeft: episodeFocus > 0
      });
      
      if (episodeFocus > 0) {
        setEpisodeFocus(episodeFocus - 1);
      }
    }
  }, [focusArea, focusedElement, seasonFocus, seasons.length, episodeFocus, actionElements]);

  const handleRightNavigation = useCallback(() => {
    if (focusArea === 'actions') {
      const currentIndex = actionElements.indexOf(focusedElement);
      const nextIndex = currentIndex < actionElements.length - 1 ? currentIndex + 1 : 0;
      setFocusedElement(actionElements[nextIndex]);
    } else if (focusArea === 'seasons') {
      if (seasonFocus < seasons.length - 1) {
        setSeasonFocus(seasonFocus + 1);
      } else {
        // Ir para a primeira temporada (navegação circular)
        setSeasonFocus(0);
      }
    } else if (focusArea === 'episodes') {
      // Navegação horizontal para direita - simples sequencial
      console.log('Right Navigation:', {
        currentFocus: episodeFocus,
        canGoRight: episodeFocus < episodes.length - 1,
        totalEpisodes: episodes.length
      });
      
      if (episodeFocus < episodes.length - 1) {
        setEpisodeFocus(episodeFocus + 1);
      }
    }
  }, [focusArea, focusedElement, seasonFocus, seasons.length, episodeFocus, episodes.length, actionElements]);

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
        // Automaticamente navegar para a área de episódios após carregar
        setTimeout(() => {
          setFocusArea('episodes');
        }, 100); // Pequeno delay para garantir que os episódios foram renderizados
      } else {
        setEpisodes([]);
        // Mesmo sem episódios, permitir navegação para área de episódios
        setTimeout(() => {
          setFocusArea('episodes');
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao carregar episódios:', error);
      setEpisodes([]);
      // Em caso de erro, ainda permitir navegação
      setTimeout(() => {
        setFocusArea('episodes');
      }, 100);
    } finally {
      setLoading(false);
    }
  }, [series.series_id, API_BASE_URL, API_CREDENTIALS]);

  const selectSeason = useCallback((seasonNumber) => {
    setSelectedSeason(seasonNumber);
    const seasonIndex = seasons.findIndex(s => s.season_number === seasonNumber);
    setSeasonFocus(seasonIndex);
    loadEpisodes(seasonNumber);
  }, [seasons, loadEpisodes]);

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
    } else if (focusArea === 'seasons' && seasons[seasonFocus]) {
      const season = seasons[seasonFocus];
      selectSeason(season.season_number);
    } else if (focusArea === 'episodes' && episodes[episodeFocus]) {
      const episode = episodes[episodeFocus];
      setSelectedEpisode(episodeFocus);
      playEpisode(episode);
    } else if (focusArea === 'episodes' && episodes.length === 0) {
      console.log('Nenhum episódio disponível para esta temporada');
    }
  }, [focusArea, focusedElement, seasons, seasonFocus, episodes, episodeFocus, selectedEpisode, playEpisode, loadFirstEpisode, toggleFavorite, selectSeason]);

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
    document.querySelectorAll('.primary-action-btn, .secondary-action-btn, .season-selector-item, .episode-card-new').forEach(el => {
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
          onBack();
          break;
        
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // DEPENDÊNCIAS APENAS DA NAVEGAÇÃO - sem loadSeriesInfo
  }, [
    isActive,
    series,
    onBack,
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
            <span>VOLTAR Sair</span>
          </div>
        </div>
      </div>

      {/* Layout Principal */}
      <div className={`series-main-layout ${focusArea === 'episodes' ? 'episodes-focused' : ''}`}>
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
      <div className={`series-episodes-area ${focusArea === 'episodes' ? 'episodes-focused' : ''}`}>
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
                        ref={(el) => (seasonElementsRef.current[index] = el)}
                      >
                        Temporada {season.season_number}
                      </div>
                    ))}
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