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

  // Estados de paginação ( مشابه a Series.js )
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 15; // 5 colunas x 3 linhas - ajuste conforme necessário para layout de filmes
  const GRID_COLUMNS = 5; // Ajuste conforme o layout de filmes
  const GRID_ROWS = 3; // Ajuste conforme o layout de filmes

  // Estado para o modal de preview
  const [previewMovie, setPreviewMovie] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Referencias para navegação
  const categoriesRef = useRef([]);
  const moviesRef = useRef([]);
  const containerRef = useRef(null);

  const API_BASE_URL = 'https://rota66.bar/player_api.php';
  const API_CREDENTIALS = 'username=zBB82J&password=AMeDHq';

  // Função para carregar categorias VOD
  const loadVODCategories = useCallback(async () => {
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
        // Chamada direta para evitar dependência circular
        const categoryId = data[0].category_id;
        setMoviesLoading(true);
        setMovieFocus(0);
        setCurrentPage(0);
        try {
          const vodResponse = await fetch(
            `${API_BASE_URL}?${API_CREDENTIALS}&action=get_vod_streams&category_id=${categoryId}`
          );
          const vodData = await vodResponse.json();
          setMovies(vodData);
        } catch (vodError) {
          console.error('Erro ao carregar filmes:', vodError);
          setMovies([]);
        } finally {
          setMoviesLoading(false);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar categorias de filmes:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, API_CREDENTIALS]);

  // Função para carregar filmes de uma categoria
  const loadVOD = useCallback(async (categoryId) => {
    setMoviesLoading(true);
    setMovieFocus(0); // Reset movie focus
    setCurrentPage(0); // Resetar para primeira página
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
  }, [API_BASE_URL, API_CREDENTIALS, focusArea]);

  // Calcular filmes da página atual
  const getCurrentPageMovies = useCallback(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return movies.slice(startIndex, endIndex);
  }, [currentPage, movies]);

  const totalPages = Math.ceil(movies.length / ITEMS_PER_PAGE);
  const currentPageMovies = getCurrentPageMovies();

  // Função para selecionar filme
  const handleMovieSelect = useCallback((movie) => {
    console.log('Filme selecionado:', movie);
    
    // Construir URL do stream com a estrutura correta
    const streamUrl = `https://rota66.bar/${API_CREDENTIALS.split('&')[0].split('=')[1]}/${API_CREDENTIALS.split('&')[1].split('=')[1]}/${movie.stream_id}`;
    
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
  }, [API_CREDENTIALS, selectedCategory, categories]);

  // Função para mostrar preview do filme
  const handleMoviePreview = useCallback((movie) => {
    const categoryInfo = categories.find(cat => cat.category_id === selectedCategory);
    const movieWithCategory = {
      ...movie,
      category_name: categoryInfo?.category_name || 'Filme'
    };
    setPreviewMovie(movieWithCategory);
    setShowPreview(true);
  }, [categories, selectedCategory]);

  // Função para clicar em categoria
  const handleCategoryClick = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    const categoryIndex = categories.findIndex(cat => cat.category_id === categoryId);
    setCategoryFocus(categoryIndex);
    loadVOD(categoryId); // loadVOD já reseta currentPage
    setFocusArea('movies'); // Mover foco para os filmes
  }, [categories, loadVOD]);

  // Carregar categorias de filmes
  useEffect(() => {
    if (isActive) {
      loadVODCategories();
    }
  }, [isActive, loadVODCategories]);

  // Função de navegação das categorias
  const handleCategoriesNavigation = useCallback((keyCode) => {
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
  }, [categories, categoryFocus, movies.length, handleCategoryClick]);

  // Função de navegação dos filmes
  const handleMoviesNavigationInternal = useCallback((keyCode) => {
    const currentPageMoviesCount = currentPageMovies.length; // Usar filmes da página atual

    if (keyCode === 38) { // Cima
      const currentRow = Math.floor(movieFocus / GRID_COLUMNS);
      if (currentRow > 0) {
        const newFocus = Math.max(0, movieFocus - GRID_COLUMNS);
        setMovieFocus(newFocus);
      } else {
        if (currentPage > 0) {
          setCurrentPage(currentPage - 1);
          const currentCol = movieFocus % GRID_COLUMNS;
          // Mover foco para a última linha da página anterior, mesma coluna (ou o mais próximo possível se a linha não estiver completa)
          const newFocusAttempt = (GRID_ROWS - 1) * GRID_COLUMNS + currentCol;
          const lastPageStartIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          const previousPageMoviesCount = movies.slice(lastPageStartIndex, lastPageStartIndex + ITEMS_PER_PAGE).length;
          setMovieFocus(Math.min(newFocusAttempt, previousPageMoviesCount -1 ));

        }
      }
    } else if (keyCode === 40) { // Baixo
      const currentRow = Math.floor(movieFocus / GRID_COLUMNS);
      const maxRow = Math.floor((currentPageMoviesCount - 1) / GRID_COLUMNS);
      if (currentRow < maxRow) {
        const newFocus = Math.min(currentPageMoviesCount - 1, movieFocus + GRID_COLUMNS);
        setMovieFocus(newFocus);
      } else {
        if (currentPage < totalPages - 1) {
          setCurrentPage(currentPage + 1);
          // Mover foco para a primeira linha da próxima página, mesma coluna
          setMovieFocus(movieFocus % GRID_COLUMNS);
        }
      }
    } else if (keyCode === 37) { // Esquerda
      const currentCol = movieFocus % GRID_COLUMNS;
      if (currentCol > 0) {
        setMovieFocus(movieFocus - 1);
      } else {
        // Se estiver na primeira coluna, voltar para categorias
        setFocusArea('categories');
        // Opcional: manter o foco na categoria selecionada
        const selectedIndex = categories.findIndex(cat => cat.category_id === selectedCategory);
        setCategoryFocus(selectedIndex >= 0 ? selectedIndex : 0);
      }
    } else if (keyCode === 39) { // Direita
      const currentCol = movieFocus % GRID_COLUMNS;
      if (currentCol < GRID_COLUMNS - 1 && movieFocus < currentPageMoviesCount - 1) {
        setMovieFocus(movieFocus + 1);
      } else {
         // Se estiver na última coluna e houver próxima página
        if (currentPage < totalPages - 1 && currentCol === GRID_COLUMNS -1) {
            setCurrentPage(currentPage + 1);
            const newRow = Math.floor(movieFocus / GRID_COLUMNS);
             // Ir para primeira coluna da mesma linha (ou primeira da próxima página)
            setMovieFocus(newRow * GRID_COLUMNS);
        }
      }
    } else if (keyCode === 13) { // OK - reproduzir filme diretamente
      if (currentPageMovies[movieFocus]) {
        const actualMovieIndex = currentPage * ITEMS_PER_PAGE + movieFocus;
        handleMovieSelect(movies[actualMovieIndex]);
      }
    } else if (keyCode === 73) { // Tecla 'I' - Info/Preview
      if (currentPageMovies[movieFocus]) {
        const actualMovieIndex = currentPage * ITEMS_PER_PAGE + movieFocus;
        handleMoviePreview(movies[actualMovieIndex]);
      }
    }
  }, [
    currentPageMovies,
    movieFocus,
    currentPage,
    totalPages,
    movies,
    categories,
    selectedCategory,
    handleMovieSelect,
    handleMoviePreview
  ]);

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
  }, [isActive, focusArea, handleCategoriesNavigation, handleMoviesNavigationInternal]);

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
        <div className="category-sidebar">
          {loading ? (
            <div className="loading">Carregando categorias...</div>
          ) : (
            categories.map((category, index) => (
              <button
                key={category.category_id}
                ref={el => categoriesRef.current[index] = el}
                className={`category-button ${
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
        <div className="content-grid">
          {moviesLoading ? (
            <div className="loading">Carregando filmes...</div>
          ) : movies.length > 0 ? (
            <>
              {totalPages > 1 && (
                <div className="pagination-info">
                  <span>Página {currentPage + 1} de {totalPages}</span>
                  <span className="movies-count">
                    {movies.length} filmes • {currentPageMovies.length} nesta página
                  </span>
                </div>
              )}
              {currentPageMovies.map((movie, index) => (
                <div
                  key={movie.stream_id}
                  ref={el => moviesRef.current[index] = el}
                  className="movie"
                  onClick={() => {
                    const actualMovieIndex = currentPage * ITEMS_PER_PAGE + index;
                    handleMovieSelect(movies[actualMovieIndex]);
                  }}
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
              ))}
            </>
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