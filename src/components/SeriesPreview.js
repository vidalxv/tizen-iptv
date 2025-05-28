import React, { useState, useEffect, useCallback } from 'react';
import './SeriesPreview.css';

const SeriesPreview = ({ series, isVisible, onClose }) => {
  const [focusedElement, setFocusedElement] = useState('play');
  const [isFavorite, setIsFavorite] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(0);
  const [focusArea, setFocusArea] = useState('actions'); // 'actions', 'seasons', 'episodes'
  const [seasonFocus, setSeasonFocus] = useState(0);
  const [episodeFocus, setEpisodeFocus] = useState(0);
  const [loading, setLoading] = useState(false);

  const actionElements = ['play', 'favorite', 'close'];
  const API_BASE_URL = 'https://rota66.bar/player_api.php';
  const API_CREDENTIALS = 'username=zBB82J&password=AMeDHq';

  const handleKeyDown = useCallback((event) => {
    if (!isVisible) return;

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
        onClose();
        break;
      
      default:
        break;
    }
  }, [focusArea, focusedElement, seasonFocus, episodeFocus, seasons, episodes, isVisible, onClose]);

  const handleUpNavigation = () => {
    if (focusArea === 'actions') {
      // Se há episódios, ir para episódios, senão temporadas
      if (episodes.length > 0) {
        setFocusArea('episodes');
        setEpisodeFocus(Math.max(0, episodes.length - 1));
      } else if (seasons.length > 0) {
        setFocusArea('seasons');
        setSeasonFocus(Math.max(0, seasons.length - 1));
      }
    } else if (focusArea === 'episodes') {
      if (episodeFocus > 0) {
        setEpisodeFocus(episodeFocus - 1);
      } else if (seasons.length > 0) {
        setFocusArea('seasons');
        setSeasonFocus(seasonFocus);
      }
    } else if (focusArea === 'seasons') {
      if (seasonFocus > 0) {
        setSeasonFocus(seasonFocus - 1);
      } else {
        setFocusArea('actions');
        setFocusedElement('play');
      }
    }
  };

  const handleDownNavigation = () => {
    if (focusArea === 'actions') {
      // Ir para temporadas se existirem
      if (seasons.length > 0) {
        setFocusArea('seasons');
        setSeasonFocus(0);
      }
    } else if (focusArea === 'seasons') {
      if (seasonFocus < seasons.length - 1) {
        setSeasonFocus(seasonFocus + 1);
      } else if (episodes.length > 0) {
        setFocusArea('episodes');
        setEpisodeFocus(0);
      }
    } else if (focusArea === 'episodes') {
      if (episodeFocus < episodes.length - 1) {
        setEpisodeFocus(episodeFocus + 1);
      } else {
        setFocusArea('actions');
        setFocusedElement('play');
      }
    }
  };

  const handleLeftNavigation = () => {
    if (focusArea === 'actions') {
      const currentIndex = actionElements.indexOf(focusedElement);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : actionElements.length - 1;
      setFocusedElement(actionElements[prevIndex]);
    }
  };

  const handleRightNavigation = () => {
    if (focusArea === 'actions') {
      const currentIndex = actionElements.indexOf(focusedElement);
      const nextIndex = currentIndex < actionElements.length - 1 ? currentIndex + 1 : 0;
      setFocusedElement(actionElements[nextIndex]);
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
        case 'close':
          onClose();
          break;
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
      // Se não há episódios carregados, tentar reproduzir primeiro episódio da primeira temporada
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
    onClose();
  };

  const loadFirstEpisode = async () => {
    try {
      setLoading(true);
      // Tentar carregar informações da série para pegar o primeiro episódio
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
    
    if (favorites[seriesKey]) {
      delete favorites[seriesKey];
      setIsFavorite(false);
    } else {
      favorites[seriesKey] = {
        ...series,
        type: 'series',
        addedAt: new Date().toISOString()
      };
      setIsFavorite(true);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
  };

  useEffect(() => {
    if (isVisible && series) {
      document.addEventListener('keydown', handleKeyDown);
      setFocusedElement('play');
      setFocusArea('actions');
      
      // Verificar se é favorito
      const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
      const seriesKey = `series_${series.series_id}`;
      setIsFavorite(!!favorites[seriesKey]);
      
      // Carregar informações da série
      loadSeriesInfo();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, series, handleKeyDown]);

  const loadSeriesInfo = async () => {
    if (!series.series_id) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}?${API_CREDENTIALS}&action=get_series_info&series_id=${series.series_id}`
      );
      const data = await response.json();
      
      if (data.episodes) {
        const seasonsData = Object.keys(data.episodes).map(seasonNum => ({
          season_number: parseInt(seasonNum),
          episode_count: data.episodes[seasonNum].length
        })).sort((a, b) => a.season_number - b.season_number);
        
        setSeasons(seasonsData);
        
        // Carregar episódios da primeira temporada automaticamente
        if (seasonsData.length > 0) {
          const firstSeason = seasonsData[0].season_number;
          setSelectedSeason(firstSeason);
          setEpisodes(data.episodes[firstSeason] || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar informações da série:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible || !series) return null;

  return (
    <div className="series-preview-overlay">
      <div className="series-preview-modal">
        <div className="series-preview-content">
          <div className="series-poster-section">
            <img 
              src={series.cover || series.stream_icon || '/images/placeholder-series.jpg'} 
              alt={series.name}
              className="series-poster-large"
              onError={(e) => {
                e.target.src = '/images/placeholder-series.jpg';
              }}
            />
          </div>
          
          <div className="series-info-section">
            <h1 className="series-title">{series.name}</h1>
            
            <div className="series-metadata">
              <span className="series-year">{series.releasedate || 'N/A'}</span>
              <span className="series-separator">•</span>
              <span className="series-rating">⭐ {series.rating || 'N/A'}</span>
              <span className="series-separator">•</span>
              <span className="series-genre">{series.category_name || 'Série'}</span>
            </div>
            
            <div className="series-description">
              <p>{series.plot || 'Descrição não disponível para esta série.'}</p>
            </div>
            
            <div className="series-actions">
              <button 
                className={`action-btn play-btn ${focusArea === 'actions' && focusedElement === 'play' ? 'focused' : ''}`}
                onClick={() => playSelectedEpisode()}
              >
                <i className="fas fa-play"></i>
                Reproduzir
              </button>
              
              <button 
                className={`action-btn favorite-btn ${focusArea === 'actions' && focusedElement === 'favorite' ? 'focused' : ''} ${isFavorite ? 'favorited' : ''}`}
                onClick={() => toggleFavorite()}
              >
                <i className={`fas ${isFavorite ? 'fa-heart' : 'fa-heart-o'}`}></i>
                {isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
              </button>
              
              <button 
                className={`action-btn close-btn ${focusArea === 'actions' && focusedElement === 'close' ? 'focused' : ''}`}
                onClick={() => onClose()}
              >
                <i className="fas fa-times"></i>
                Fechar
              </button>
            </div>
          </div>
        </div>
        
        {/* Seção de Temporadas e Episódios */}
        <div className="series-details">
          {loading ? (
            <div className="loading">Carregando informações da série...</div>
          ) : (
            <div className="series-content">
              {/* Temporadas */}
              {seasons.length > 0 && (
                <div className="seasons-section">
                  <h3>Temporadas</h3>
                  <div className="seasons-list">
                    {seasons.map((season, index) => (
                      <div
                        key={season.season_number}
                        className={`season-item ${
                          selectedSeason === season.season_number ? 'active' : ''
                        } ${
                          focusArea === 'seasons' && seasonFocus === index ? 'focused' : ''
                        }`}
                        onClick={() => selectSeason(season.season_number)}
                      >
                        Temporada {season.season_number}
                        <span className="episode-count">({season.episode_count} eps)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Episódios */}
              {episodes.length > 0 && (
                <div className="episodes-section">
                  <h3>Episódios - Temporada {selectedSeason}</h3>
                  <div className="episodes-list">
                    {episodes.map((episode, index) => (
                      <div
                        key={episode.id || index}
                        className={`episode-item ${
                          selectedEpisode === index ? 'active' : ''
                        } ${
                          focusArea === 'episodes' && episodeFocus === index ? 'focused' : ''
                        }`}
                        onClick={() => {
                          setSelectedEpisode(index);
                          playEpisode(episode);
                        }}
                      >
                        <div className="episode-number">
                          E{String(episode.episode_num || index + 1).padStart(2, '0')}
                        </div>
                        <div className="episode-info">
                          <h4>{episode.title || episode.name || `Episódio ${episode.episode_num || index + 1}`}</h4>
                          {episode.plot && <p>{episode.plot}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="modal-help">
          <span>↑↓ Navegar</span>
          <span>← → Navegar Ações</span>
          <span>ENTER Selecionar</span>
          <span>VOLTAR Fechar</span>
        </div>
      </div>
    </div>
  );
};

export default SeriesPreview; 