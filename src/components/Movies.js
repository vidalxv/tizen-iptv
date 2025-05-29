import React, { useState, useEffect, useRef, useCallback } from 'react';
import MoviePreview from './MoviePreview';
import './Movies.css';

const Movies = ({ isActive }) => {
  const [categories, setCategories] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [moviesLoading, setMoviesLoading] = useState(false);
  
  // Estados de navegação
  const [focusArea, setFocusArea] = useState('categories'); // 'categories' ou 'movies'
  const [categoryFocus, setCategoryFocus] = useState(0);
  const [movieFocus, setMovieFocus] = useState(0);

  // Estado para o modal de preview
  const [previewMovie, setPreviewMovie] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Referencias para navegação
  const categoriesRef = useRef([]);
  const moviesRef = useRef([]);
  const containerRef = useRef(null);

  const API_BASE_URL = 'https://rota66.bar/player_api.php';
  const API_CREDENTIALS = 'username=zBB82J&password=AMeDHq';

  // Carregar categorias de filmes
  useEffect(() => {
    if (isActive) {
      loadVODCategories();
    }
  }, [isActive]);

  // Sistema de navegação por controle remoto
  useEffect(() => {
    if (!isActive) return;

    const handleMoviesNavigation = (event) => {
      const { keyCode } = event.detail;
      
      if (focusArea === 'categories') {
        handleCategoriesNavigation(keyCode);
      } else if (focusArea === 'movies') {
        handleMoviesNavigationInternal(keyCode);
      }
    };

    window.addEventListener('moviesNavigation', handleMoviesNavigation);
    return () => window.removeEventListener('moviesNavigation', handleMoviesNavigation);
  }, [isActive, focusArea, categoryFocus, movieFocus, categories, movies]);

  const updateFocusVisual = useCallback(() => {
    // Remover foco de todos os elementos
    document.querySelectorAll('.movie, .vod-category-button').forEach(el => {
      el.classList.remove('focused');
    });

    // Adicionar foco ao elemento atual
    if (focusArea === 'categories' && categoriesRef.current[categoryFocus]) {
      categoriesRef.current[categoryFocus].classList.add('focused');
      categoriesRef.current[categoryFocus].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    } else if (focusArea === 'movies' && moviesRef.current[movieFocus]) {
      moviesRef.current[movieFocus].classList.add('focused');
      moviesRef.current[movieFocus].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [focusArea, categoryFocus, movieFocus]);

  // Atualizar foco visual
  useEffect(() => {
    updateFocusVisual();
  }, [updateFocusVisual]);

  const handleCategoriesNavigation = (keyCode) => {
    if (keyCode === 38) { // Cima
      setCategoryFocus(prev => (prev > 0 ? prev - 1 : categories.length - 1));
    } else if (keyCode === 40) { // Baixo
      setCategoryFocus(prev => (prev < categories.length - 1 ? prev + 1 : 0));
    } else if (keyCode === 37) { // Esquerda - voltar para sidebar
      const backEvent = new CustomEvent('backToSidebar');
      window.dispatchEvent(backEvent);
    } else if (keyCode === 39) { // Direita - ir para filmes
      if (movies.length > 0) {
        setFocusArea('movies');
        setMovieFocus(0);
      }
    } else if (keyCode === 13) { // OK - selecionar categoria
      if (categories[categoryFocus]) {
        handleCategoryClick(categories[categoryFocus].category_id);
      }
    }
  };

  const handleMoviesNavigationInternal = (keyCode) => {
    const moviesPerRow = Math.floor((window.innerWidth - 320) / 190); // Aproximação baseada no grid
    const totalMovies = movies.length;
    
    if (keyCode === 38) { // Cima
      const newFocus = movieFocus - moviesPerRow;
      setMovieFocus(newFocus >= 0 ? newFocus : movieFocus);
    } else if (keyCode === 40) { // Baixo
      const newFocus = movieFocus + moviesPerRow;
      setMovieFocus(newFocus < totalMovies ? newFocus : movieFocus);
    } else if (keyCode === 37) { // Esquerda
      if (movieFocus % moviesPerRow === 0) {
        // Se estiver na primeira coluna, voltar para categorias
        setFocusArea('categories');
      } else {
        setMovieFocus(prev => (prev > 0 ? prev - 1 : 0));
      }
    } else if (keyCode === 39) { // Direita
      setMovieFocus(prev => (prev < totalMovies - 1 ? prev + 1 : prev));
    } else if (keyCode === 13) { // OK - reproduzir filme diretamente
      if (movies[movieFocus]) {
        handleMovieSelect(movies[movieFocus]);
      }
    } else if (keyCode === 73) { // Tecla 'I' - Info/Preview
      if (movies[movieFocus]) {
        handleMoviePreview(movies[movieFocus]);
      }
    }
  };

  const loadVODCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}?${API_CREDENTIALS}&action=get_vod_categories`
      );
      const data = await response.json();
      setCategories(data);
      
      // Selecionar primeira categoria automaticamente
      if (data.length > 0) {
        setSelectedCategory(data[0].category_id);
        setCategoryFocus(0);
        loadVOD(data[0].category_id);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias de filmes:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVOD = async (categoryId) => {
    setMoviesLoading(true);
    setMovieFocus(0); // Reset movie focus
    try {
      const response = await fetch(
        `${API_BASE_URL}?${API_CREDENTIALS}&action=get_vod_streams&category_id=${categoryId}`
      );
      const data = await response.json();
      setMovies(data);
      
      // Se estivermos no grid de filmes, voltar o foco para os filmes
      if (focusArea === 'movies') {
        setMovieFocus(0);
      }
    } catch (error) {
      console.error('Erro ao carregar filmes:', error);
      setMovies([]);
    } finally {
      setMoviesLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    const categoryIndex = categories.findIndex(cat => cat.category_id === categoryId);
    setCategoryFocus(categoryIndex);
    loadVOD(categoryId);
    setFocusArea('movies'); // Mover foco para os filmes
  };

  const handleMovieSelect = (movie) => {
    console.log('Filme selecionado:', movie);
    
    // Construir URL do stream
    const streamUrl = `https://rota66.bar/movie/${API_CREDENTIALS.split('&')[0].split('=')[1]}/${API_CREDENTIALS.split('&')[1].split('=')[1]}/${movie.stream_id}.mp4`;
    
    // Informações do filme para o player
    const streamInfo = {
      name: movie.name,
      category: selectedCategory ? categories.find(cat => cat.category_id === selectedCategory)?.category_name : 'Filme',
      description: movie.plot || `Filme - ${movie.name}`,
      year: movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null,
      rating: movie.rating,
      type: 'movie'
    };

    // Disparar evento para reproduzir no VideoPlayer
    const playEvent = new CustomEvent('playContent', {
      detail: { streamUrl, streamInfo }
    });
    window.dispatchEvent(playEvent);
  };

  const handleMoviePreview = (movie) => {
    const categoryInfo = categories.find(cat => cat.category_id === selectedCategory);
    const movieWithCategory = {
      ...movie,
      category_name: categoryInfo?.category_name || 'Filme'
    };
    setPreviewMovie(movieWithCategory);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewMovie(null);
  };

  // Função para tratar erros de imagem
  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  if (!isActive) return null;

  return (
    <div className="movies-container" ref={containerRef}>
      <div className="movies-layout">
        {/* Lista de Categorias */}
        <div className="vod-categories">
          {loading ? (
            <div className="loading">Carregando categorias...</div>
          ) : (
            categories.map((category, index) => (
              <button
                key={category.category_id}
                ref={el => categoriesRef.current[index] = el}
                className={`vod-category-button ${
                  selectedCategory === category.category_id ? 'active' : ''
                }`}
                onClick={() => handleCategoryClick(category.category_id)}
                data-focusable="true"
                data-category={category.category_id}
              >
                {category.category_name}
              </button>
            ))
          )}
        </div>

        {/* Grid de Filmes */}
        <div className="vod-display">
          {moviesLoading ? (
            <div className="loading">Carregando filmes...</div>
          ) : movies.length > 0 ? (
            movies.map((movie, index) => (
              <div
                key={movie.stream_id}
                ref={el => moviesRef.current[index] = el}
                className="movie"
                onClick={() => handleMovieSelect(movie)}
                data-focusable="true"
                data-movie={movie.stream_id}
              >
                {(movie.stream_icon || movie.cover) && (
                  <img
                    src={movie.stream_icon || movie.cover}
                    alt={movie.name}
                    onError={handleImageError}
                  />
                )}
                <div className="movie-info">
                  <h3>{movie.name}</h3>
                </div>
              </div>
            ))
          ) : (
            <div className="no-content">
              Nenhum filme encontrado nesta categoria
            </div>
          )}
        </div>
      </div>
      {showPreview && (
        <MoviePreview
          movie={previewMovie}
          isVisible={showPreview}
          onClose={closePreview}
        />
      )}
    </div>
  );
};

export default Movies; 