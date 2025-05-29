import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Series.css';

const Series = ({ isActive }) => {
  const [categories, setCategories] = useState([]);
  const [series, setSeries] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seriesLoading, setSeriesLoading] = useState(false);
  
  // Estados de navegação
  const [focusArea, setFocusArea] = useState('categories'); // 'categories' ou 'series'
  const [categoryFocus, setCategoryFocus] = useState(0);
  const [seriesFocus, setSeriesFocus] = useState(0);

  // Referencias para navegação
  const categoriesRef = useRef([]);
  const seriesRef = useRef([]);
  const containerRef = useRef(null);

  const API_BASE_URL = 'https://rota66.bar/player_api.php';
  const API_CREDENTIALS = 'username=zBB82J&password=AMeDHq';

  // Carregar categorias de séries
  useEffect(() => {
    const loadSeriesCategories = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}?${API_CREDENTIALS}&action=get_series_categories`
        );
        const data = await response.json();
        setCategories(data);
        
        // Selecionar primeira categoria automaticamente
        if (data.length > 0) {
          setSelectedCategory(data[0].category_id);
          setCategoryFocus(0);
          loadSeries(data[0].category_id);
        }
      } catch (error) {
        console.error('Erro ao carregar categorias de séries:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    const loadSeries = async (categoryId) => {
      setSeriesLoading(true);
      setSeriesFocus(0); // Reset series focus
      try {
        const response = await fetch(
          `${API_BASE_URL}?${API_CREDENTIALS}&action=get_series&category_id=${categoryId}`
        );
        const data = await response.json();
        setSeries(data);
        
        // Se estivermos no grid de series, voltar o foco para as series
        if (focusArea === 'series') {
          setSeriesFocus(0);
        }
      } catch (error) {
        console.error('Erro ao carregar series:', error);
        setSeries([]);
      } finally {
        setSeriesLoading(false);
      }
    };

    if (isActive) {
      loadSeriesCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Atualizar foco visual
  const updateFocusVisual = useCallback(() => {
    // Remover foco de todos os elementos
    document.querySelectorAll('.series, .series-category-button').forEach(el => {
      el.classList.remove('focused');
    });

    // Adicionar foco ao elemento atual
    if (focusArea === 'categories' && categoriesRef.current[categoryFocus]) {
      categoriesRef.current[categoryFocus].classList.add('focused');
      categoriesRef.current[categoryFocus].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    } else if (focusArea === 'series' && seriesRef.current[seriesFocus]) {
      seriesRef.current[seriesFocus].classList.add('focused');
      seriesRef.current[seriesFocus].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [focusArea, categoryFocus, seriesFocus]);

  useEffect(() => {
    updateFocusVisual();
  }, [updateFocusVisual]);

  // Função para carregar séries de uma categoria
  const loadSeries = useCallback(async (categoryId) => {
    setSeriesLoading(true);
    setSeriesFocus(0); // Reset series focus
    try {
      const response = await fetch(
        `${API_BASE_URL}?${API_CREDENTIALS}&action=get_series&category_id=${categoryId}`
      );
      const data = await response.json();
      setSeries(data);
      
      // Se estivermos no grid de series, voltar o foco para as series
      if (focusArea === 'series') {
        setSeriesFocus(0);
      }
    } catch (error) {
      console.error('Erro ao carregar series:', error);
      setSeries([]);
    } finally {
      setSeriesLoading(false);
    }
  }, [API_BASE_URL, API_CREDENTIALS, focusArea]);

  // Função para navegar para detalhes da série
  const handleSeriesDetails = useCallback((series) => {
    const categoryInfo = categories.find(cat => cat.category_id === selectedCategory);
    const seriesWithCategory = {
      ...series,
      category_name: categoryInfo?.category_name || 'Série'
    };
    
    // Disparar evento para navegar para a página de detalhes
    const showDetailsEvent = new CustomEvent('showSeriesDetails', {
      detail: { series: seriesWithCategory }
    });
    window.dispatchEvent(showDetailsEvent);
  }, [categories, selectedCategory]);

  // Função para reproduzir série diretamente (primeira temporada, primeiro episódio)
  const handleSeriesSelect = useCallback(async (series) => {
    try {
      // Tentar carregar informações da série para reproduzir primeiro episódio
      const response = await fetch(
        `${API_BASE_URL}?${API_CREDENTIALS}&action=get_series_info&series_id=${series.series_id}`
      );
      const data = await response.json();
      
      if (data.episodes && Object.keys(data.episodes).length > 0) {
        const firstSeason = Object.keys(data.episodes)[0];
        const firstEpisode = data.episodes[firstSeason][0];
        
        if (firstEpisode) {
          const playEvent = new CustomEvent('playContent', {
            detail: {
              streamUrl: `https://rota66.bar/series/zBB82J/AMeDHq/${firstEpisode.id || firstEpisode.stream_id}.mp4`,
              streamInfo: {
                name: `${series.name} - S${String(firstSeason).padStart(2, '0')}E${String(firstEpisode.episode_num || 1).padStart(2, '0')} - ${firstEpisode.title || firstEpisode.name || 'Episódio'}`,
                type: 'series',
                category: selectedCategory ? categories.find(cat => cat.category_id === selectedCategory)?.category_name : 'Série',
                description: firstEpisode.plot || firstEpisode.info?.plot || series.plot || 'Descrição não disponível',
                year: series.releasedate || 'N/A',
                rating: series.rating || firstEpisode.rating || 'N/A',
                poster: series.cover || series.stream_icon
              }
            }
          });
          window.dispatchEvent(playEvent);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar informações da série:', error);
      
      // Fallback: tentar reproduzir com URL genérica
      const streamUrl = `https://rota66.bar/series/${API_CREDENTIALS.split('&')[0].split('=')[1]}/${API_CREDENTIALS.split('&')[1].split('=')[1]}/${series.series_id}.mp4`;
      
      const streamInfo = {
        name: series.name,
        category: selectedCategory ? categories.find(cat => cat.category_id === selectedCategory)?.category_name : 'Série',
        description: `Série - ${series.name}`,
        type: 'series'
      };

      const playEvent = new CustomEvent('playContent', {
        detail: { streamUrl, streamInfo }
      });
      window.dispatchEvent(playEvent);
    }
  }, [selectedCategory, categories, API_BASE_URL, API_CREDENTIALS]);

  // Sistema de navegação por controle remoto
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          if (focusArea === 'categories') {
            setCategoryFocus(prev => Math.max(0, prev - 1));
          } else if (focusArea === 'series') {
            const gridColumns = 5;
            const currentRow = Math.floor(seriesFocus / gridColumns);
            
            if (currentRow > 0) {
              const newFocus = Math.max(0, seriesFocus - gridColumns);
              setSeriesFocus(newFocus);
            } else {
              // Voltar para categorias
              setFocusArea('categories');
              // Definir o foco na categoria atualmente selecionada
              const selectedIndex = categories.findIndex(cat => cat.category_id === selectedCategory);
              setCategoryFocus(selectedIndex >= 0 ? selectedIndex : 0);
            }
          }
          break;

        case 'ArrowDown':
          event.preventDefault();
          if (focusArea === 'categories') {
            setCategoryFocus(prev => Math.min(categories.length - 1, prev + 1));
          } else if (focusArea === 'series') {
            const gridColumns = 5;
            const currentRow = Math.floor(seriesFocus / gridColumns);
            const totalRows = Math.ceil(series.length / gridColumns);
            
            if (currentRow < totalRows - 1) {
              const newFocus = Math.min(series.length - 1, seriesFocus + gridColumns);
              setSeriesFocus(newFocus);
            }
          }
          break;

        case 'ArrowLeft':
          event.preventDefault();
          if (focusArea === 'categories') {
            // Na sidebar, seta esquerda não faz nada
          } else if (focusArea === 'series') {
            const gridColumns = 5;
            const currentCol = seriesFocus % gridColumns;
            
            if (currentCol > 0) {
              setSeriesFocus(seriesFocus - 1);
            } else {
              // Voltar para categorias quando na primeira coluna
              setFocusArea('categories');
              // Definir o foco na categoria atualmente selecionada
              const selectedIndex = categories.findIndex(cat => cat.category_id === selectedCategory);
              setCategoryFocus(selectedIndex >= 0 ? selectedIndex : 0);
            }
          }
          break;

        case 'ArrowRight':
          event.preventDefault();
          if (focusArea === 'categories') {
            // Ir para séries se houver séries carregadas
            if (series.length > 0) {
              setFocusArea('series');
              setSeriesFocus(0);
            }
          } else if (focusArea === 'series') {
            const gridColumns = 5;
            const currentCol = seriesFocus % gridColumns;
            
            if (currentCol < gridColumns - 1 && seriesFocus < series.length - 1) {
              setSeriesFocus(seriesFocus + 1);
            }
          }
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusArea === 'categories') {
            const selectedCat = categories[categoryFocus];
            if (selectedCat) {
              setSelectedCategory(selectedCat.category_id);
              loadSeries(selectedCat.category_id);
            }
          } else if (focusArea === 'series') {
            const selectedSeries = series[seriesFocus];
            if (selectedSeries) {
              handleSeriesDetails(selectedSeries);
            }
          }
          break;

        case 'Escape':
        case 'Backspace':
          event.preventDefault();
          if (focusArea === 'series') {
            // Voltar para categorias
            setFocusArea('categories');
            // Definir o foco na categoria atualmente selecionada
            const selectedIndex = categories.findIndex(cat => cat.category_id === selectedCategory);
            setCategoryFocus(selectedIndex >= 0 ? selectedIndex : 0);
          }
          break;

        case 'p':
        case 'P':
          event.preventDefault();
          if (focusArea === 'series') {
            const selectedSeries = series[seriesFocus];
            if (selectedSeries) {
              handleSeriesSelect(selectedSeries);
            }
          }
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, focusArea, categoryFocus, seriesFocus, categories, series, selectedCategory, handleSeriesDetails, handleSeriesSelect, loadSeries]);

  // Função para tratar erros de imagem
  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  if (!isActive) return null;

  return (
    <div className="series-page" ref={containerRef}>
      <div className="series-sidebar">
        <h2>Categorias de Séries</h2>
        {loading ? (
          <div className="loading">Carregando categorias...</div>
        ) : (
          <div className="series-categories">
            {categories.map((category, index) => (
              <button
                key={category.category_id}
                ref={el => categoriesRef.current[index] = el}
                className={`series-category-button ${
                  selectedCategory === category.category_id ? 'active' : ''
                }`}
                onClick={() => {
                  setSelectedCategory(category.category_id);
                  setCategoryFocus(index);
                  loadSeries(category.category_id);
                }}
              >
                {category.category_name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="series-main">
        <div className="series-content">
          {seriesLoading ? (
            <div className="loading">Carregando séries...</div>
          ) : (
            <div className="series-grid">
              {series.map((series, index) => (
                <div
                  key={series.series_id}
                  ref={el => seriesRef.current[index] = el}
                  className="series"
                  onClick={() => handleSeriesDetails(series)}
                >
                  <div className="series-poster">
                    <img
                      src={series.cover}
                      alt={series.name}
                      onError={handleImageError}
                    />
                    <div className="series-overlay">
                      <h3 className="series-title">{series.name}</h3>
                      <div className="series-info">
                        <span className="series-year">{series.year || 'N/A'}</span>
                        <span className="series-rating">
                          ⭐ {series.rating || 'N/A'}
                        </span>
                      </div>
                      <p className="series-description">
                        {series.plot ? 
                          (series.plot.length > 120 ? 
                            series.plot.substring(0, 120) + '...' : 
                            series.plot
                          ) : 
                          'Descrição não disponível'
                        }
                      </p>
                      <div className="series-actions">
                        <span className="action-hint">ENTER Ver detalhes</span>
                        <span className="action-hint">P Reproduzir</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Series; 