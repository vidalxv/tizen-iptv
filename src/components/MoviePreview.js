import React, { useState, useEffect, useCallback } from 'react';
import './MoviePreview.css';

const MoviePreview = ({ movie, isVisible, onClose }) => {
  const [focusedElement, setFocusedElement] = useState('play');
  const [isFavorite, setIsFavorite] = useState(false);

  const navigableElements = ['play', 'favorite', 'close'];

  const handleKeyDown = useCallback((event) => {
    if (!isVisible) return;

    const currentIndex = navigableElements.indexOf(focusedElement);

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : navigableElements.length - 1;
        setFocusedElement(navigableElements[prevIndex]);
        break;
      
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = currentIndex < navigableElements.length - 1 ? currentIndex + 1 : 0;
        setFocusedElement(navigableElements[nextIndex]);
        break;
      
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleAction(focusedElement);
        break;
      
      case 'Escape':
      case 'Backspace':
        event.preventDefault();
        onClose();
        break;
      
      default:
        break;
    }
  }, [focusedElement, isVisible, onClose]);

  const handleAction = (action) => {
    switch (action) {
      case 'play':
        // Disparar evento para reproduzir filme
        const playEvent = new CustomEvent('playContent', {
          detail: {
            streamUrl: `https://rota66.bar/movie/zBB82J/AMeDHq/${movie.stream_id}.m3u8`,
            streamInfo: {
              name: movie.name,
              type: 'movie',
              category: movie.category_name || 'Filme',
              description: movie.plot || 'Descrição não disponível',
              year: movie.releasedate || 'N/A',
              rating: movie.rating || 'N/A',
              poster: movie.stream_icon
            }
          }
        });
        window.dispatchEvent(playEvent);
        onClose();
        break;
      
      case 'favorite':
        toggleFavorite();
        break;
      
      case 'close':
        onClose();
        break;
      
      default:
        break;
    }
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
    const movieKey = `movie_${movie.stream_id}`;
    
    if (favorites[movieKey]) {
      delete favorites[movieKey];
      setIsFavorite(false);
    } else {
      favorites[movieKey] = {
        ...movie,
        type: 'movie',
        addedAt: new Date().toISOString()
      };
      setIsFavorite(true);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
  };

  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      setFocusedElement('play'); // Reset focus ao abrir
      
      // Verificar se é favorito
      const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
      const movieKey = `movie_${movie.stream_id}`;
      setIsFavorite(!!favorites[movieKey]);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, handleKeyDown, movie]);

  if (!isVisible || !movie) return null;

  return (
    <div className="movie-preview-overlay">
      <div className="movie-preview-modal">
        <div className="movie-preview-content">
          <div className="movie-poster-section">
            <img 
              src={movie.stream_icon || '/images/placeholder-movie.jpg'} 
              alt={movie.name}
              className="movie-poster-large"
              onError={(e) => {
                e.target.src = '/images/placeholder-movie.jpg';
              }}
            />
          </div>
          
          <div className="movie-info-section">
            <h1 className="movie-title">{movie.name}</h1>
            
            <div className="movie-metadata">
              <span className="movie-year">{movie.releasedate || 'N/A'}</span>
              <span className="movie-separator">•</span>
              <span className="movie-rating">⭐ {movie.rating || 'N/A'}</span>
              <span className="movie-separator">•</span>
              <span className="movie-genre">{movie.category_name || 'Filme'}</span>
            </div>
            
            <div className="movie-description">
              <p>{movie.plot || 'Descrição não disponível para este filme.'}</p>
            </div>
            
            <div className="movie-actions">
              <button 
                className={`action-btn play-btn ${focusedElement === 'play' ? 'focused' : ''}`}
                onClick={() => handleAction('play')}
              >
                <i className="fas fa-play"></i>
                Reproduzir
              </button>
              
              <button 
                className={`action-btn favorite-btn ${focusedElement === 'favorite' ? 'focused' : ''} ${isFavorite ? 'favorited' : ''}`}
                onClick={() => handleAction('favorite')}
              >
                <i className={`fas ${isFavorite ? 'fa-heart' : 'fa-heart-o'}`}></i>
                {isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
              </button>
              
              <button 
                className={`action-btn close-btn ${focusedElement === 'close' ? 'focused' : ''}`}
                onClick={() => handleAction('close')}
              >
                <i className="fas fa-times"></i>
                Fechar
              </button>
            </div>
          </div>
        </div>
        
        <div className="modal-help">
          <span>← → Navegar</span>
          <span>ENTER Selecionar</span>
          <span>VOLTAR Fechar</span>
        </div>
      </div>
    </div>
  );
};

export default MoviePreview; 