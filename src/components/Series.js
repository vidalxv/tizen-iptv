import React, { useState, useEffect, useRef, useCallback } from 'react';
import SeriesPreview from './SeriesPreview';
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

  // Estado para o modal de preview
  const [previewSeries, setPreviewSeries] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

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

  // Sistema de navegação por controle remoto
  useEffect(() => {
    if (!isActive) return;

    const handleCategoriesNavigation = (keyCode) => {
      if (keyCode === 38) { // Cima
        setCategoryFocus(prev => (prev > 0 ? prev - 1 : categories.length - 1));
      } else if (keyCode === 40) { // Baixo
        setCategoryFocus(prev => (prev < categories.length - 1 ? prev + 1 : 0));
      } else if (keyCode === 37) { // Esquerda - voltar para sidebar
        const backEvent = new CustomEvent('backToSidebar');
        window.dispatchEvent(backEvent);
      } else if (keyCode === 39) { // Direita - ir para series
        if (series.length > 0) {
          setFocusArea('series');
          setSeriesFocus(0);
        }
      } else if (keyCode === 13) { // OK - selecionar categoria
        if (categories[categoryFocus]) {
          handleCategoryClick(categories[categoryFocus].category_id);
        }
      }
    };

    const handleSeriesNavigationInternal = (keyCode) => {
      const seriesPerRow = Math.floor((window.innerWidth - 320) / 190); // Aproximação baseada no grid
      const totalSeries = series.length;
      
      if (keyCode === 38) { // Cima
        const newFocus = seriesFocus - seriesPerRow;
        setSeriesFocus(newFocus >= 0 ? newFocus : seriesFocus);
      } else if (keyCode === 40) { // Baixo
        const newFocus = seriesFocus + seriesPerRow;
        setSeriesFocus(newFocus < totalSeries ? newFocus : seriesFocus);
      } else if (keyCode === 37) { // Esquerda
        if (seriesFocus % seriesPerRow === 0) {
          // Se estiver na primeira coluna, voltar para categorias
          setFocusArea('categories');
        } else {
          setSeriesFocus(prev => (prev > 0 ? prev - 1 : 0));
        }
      } else if (keyCode === 39) { // Direita
        setSeriesFocus(prev => (prev < totalSeries - 1 ? prev + 1 : prev));
      } else if (keyCode === 13) { // OK - abrir tela de detalhes
        if (series[seriesFocus]) {
          handleSeriesPreview(series[seriesFocus]);
        }
      } else if (keyCode === 80) { // Tecla 'P' - Play direto
        if (series[seriesFocus]) {
          handleSeriesSelect(series[seriesFocus]);
        }
      } else if (keyCode === 73) { // Tecla 'I' - Info/Preview (mantido como alternativa)
        if (series[seriesFocus]) {
          handleSeriesPreview(series[seriesFocus]);
        }
      }
    };

    const handleSeriesNavigation = (event) => {
      const { keyCode } = event.detail;
      
      if (focusArea === 'categories') {
        handleCategoriesNavigation(keyCode);
      } else if (focusArea === 'series') {
        handleSeriesNavigationInternal(keyCode);
      }
    };

    window.addEventListener('seriesNavigation', handleSeriesNavigation);
    return () => window.removeEventListener('seriesNavigation', handleSeriesNavigation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, focusArea, categoryFocus, seriesFocus, categories, series]);

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

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    const categoryIndex = categories.findIndex(cat => cat.category_id === categoryId);
    setCategoryFocus(categoryIndex);
    loadSeries(categoryId);
    setFocusArea('series'); // Mover foco para as series
  };

  const handleSeriesSelect = async (series) => {
    console.log('series selecionada:', series);
    
    try {
      // Buscar informações detalhadas da series e episódios
      const response = await fetch(
        `${API_BASE_URL}?${API_CREDENTIALS}&action=get_series_info&series_id=${series.series_id}`
      );
      const seriesInfo = await response.json();
      
      // Buscar primeiro episódio disponível
      if (seriesInfo.episodes && Object.keys(seriesInfo.episodes).length > 0) {
        const firstSeason = Object.keys(seriesInfo.episodes)[0];
        const firstEpisode = seriesInfo.episodes[firstSeason][0];
        
        // Construir URL do stream para o primeiro episódio
        const streamUrl = `https://rota66.bar/series/${API_CREDENTIALS.split('&')[0].split('=')[1]}/${API_CREDENTIALS.split('&')[1].split('=')[1]}/${firstEpisode.id}.mp4`;
        
        // Informações da series para o player
        const streamInfo = {
          name: `${series.name} - S${firstSeason}E${firstEpisode.episode_num} - ${firstEpisode.title}`,
          category: selectedCategory ? categories.find(cat => cat.category_id === selectedCategory)?.category_name : 'series',
          description: firstEpisode.plot || seriesInfo.info?.plot || `series - ${series.name}`,
          year: seriesInfo.info?.releaseDate ? new Date(seriesInfo.info.releaseDate).getFullYear() : null,
          rating: seriesInfo.info?.rating,
          type: 'series'
        };

        // Disparar evento para reproduzir no VideoPlayer
        const playEvent = new CustomEvent('playContent', {
          detail: { streamUrl, streamInfo }
        });
        window.dispatchEvent(playEvent);
      } else {
        // Se não encontrar episódios, tentar URL genérica
        const streamUrl = `https://rota66.bar/series/${API_CREDENTIALS.split('&')[0].split('=')[1]}/${API_CREDENTIALS.split('&')[1].split('=')[1]}/${series.series_id}.mp4`;
        
        const streamInfo = {
          name: series.name,
          category: selectedCategory ? categories.find(cat => cat.category_id === selectedCategory)?.category_name : 'series',
          description: `series - ${series.name}`,
          type: 'series'
        };

        const playEvent = new CustomEvent('playContent', {
          detail: { streamUrl, streamInfo }
        });
        window.dispatchEvent(playEvent);
      }
    } catch (error) {
      console.error('Erro ao carregar informações da series:', error);
      
      // Fallback: tentar reproduzir com URL genérica
      const streamUrl = `https://rota66.bar/series/${API_CREDENTIALS.split('&')[0].split('=')[1]}/${API_CREDENTIALS.split('&')[1].split('=')[1]}/${series.series_id}.mp4`;
      
      const streamInfo = {
        name: series.name,
        category: selectedCategory ? categories.find(cat => cat.category_id === selectedCategory)?.category_name : 'series',
        description: `series - ${series.name}`,
        type: 'series'
      };

      const playEvent = new CustomEvent('playContent', {
        detail: { streamUrl, streamInfo }
      });
      window.dispatchEvent(playEvent);
    }
  };

  const handleSeriesPreview = (series) => {
    const categoryInfo = categories.find(cat => cat.category_id === selectedCategory);
    const seriesWithCategory = {
      ...series,
      category_name: categoryInfo?.category_name || 'Série'
    };
    setPreviewSeries(seriesWithCategory);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewSeries(null);
  };

  // Função para tratar erros de imagem
  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  if (!isActive) return null;

  return (
    <div className="series-container" ref={containerRef}>
      <div className="series-layout">
        {/* Lista de Categorias */}
        <div className="series-categories">
          {loading ? (
            <div className="loading">Carregando categorias...</div>
          ) : (
            categories.map((category, index) => (
              <button
                key={category.category_id}
                ref={el => categoriesRef.current[index] = el}
                className={`series-category-button ${
                  selectedCategory === category.category_id ? 'active' : ''
                }`}
                onClick={() => handleCategoryClick(category.category_id)}
              >
                {category.category_name}
              </button>
            ))
          )}
        </div>

        {/* Grid de series */}
        <div className="series-content">
          {seriesLoading ? (
            <div className="loading">Carregando series...</div>
          ) : (
            <div className="series-grid">
              {series.map((series, index) => (
                <div
                  key={series.series_id}
                  ref={el => seriesRef.current[index] = el}
                  className="series"
                  onClick={() => handleSeriesSelect(series)}
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showPreview && (
        <SeriesPreview
          series={previewSeries}
          isVisible={showPreview}
          onClose={closePreview}
        />
      )}
    </div>
  );
};

export default Series; 