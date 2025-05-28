import React, { useState, useEffect } from 'react';
import { iptvApi } from '../services/iptvApi';
import './Home.css';

const Home = ({ onMenu, menuFocus, shelfFocus, itemFocus }) => {
  const [lancamentos, setLancamentos] = useState([]);
  const [telenovelas, setTelenovelas] = useState([]);
  const [classicos, setClassicos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados da API quando o componente montar
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        
        // Carregar dados em paralelo
        const [lancamentosData, telenovelaData, classicosData] = await Promise.all([
          iptvApi.getLancamentos(),
          iptvApi.getTelenovelas(),
          iptvApi.getClassicos()
        ]);

        setLancamentos(lancamentosData.slice(0, 10)); // Limitar a 10 itens
        setTelenovelas(telenovelaData.slice(0, 10));
        setClassicos(classicosData.slice(0, 10));
        
      } catch (error) {
        console.error('Erro ao carregar dados do home:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const shelves = [
    { title: 'Filmes Lançamentos', items: lancamentos, type: 'movie' },
    { title: 'Telenovelas', items: telenovelas, type: 'series' },
    { title: 'Clássicos do Cinema', items: classicos, type: 'movie' }
  ];

  const handleItemClick = (item, type) => {
    console.log('Item clicado:', item, 'Tipo:', type);
    // TODO: Implementar modal de preview ou navegação para player
  };

  if (loading) {
    return (
      <div className="home-loading">
        <i className="fa-solid fa-spinner fa-spin"></i>
        <p>Carregando conteúdo...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Banner principal */}
      <section className="home-hero">
        <div className="hero-background">
          <img 
            src="/images/banner (1).jpg" 
            alt="Banner Principal" 
            className="hero-bg-image"
          />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <img 
            src="/images/BIGTV-transparente.png" 
            alt="BIGTV Logo" 
            className="hero-logo"
          />
          <h1 className="hero-title">Seu entretenimento completo</h1>
          <p className="hero-description">
            Acesse milhares de filmes, séries, canais ao vivo e muito mais.
            Entretenimento de qualidade na palma da sua mão.
          </p>
          <div className="hero-actions">
            <button className="hero-btn primary">
              <i className="fa-solid fa-play"></i>
              Explorar Conteúdo
            </button>
            <button className="hero-btn secondary">
              <i className="fa-solid fa-tv"></i>
              Canais ao Vivo
            </button>
          </div>
        </div>
      </section>

      {/* Prateleiras de conteúdo */}
      <section className="home-shelves">
        {shelves.map((shelf, shelfIndex) => (
          <div key={shelf.title} className="shelf">
            <h2 className="shelf-title">{shelf.title}</h2>
            <div className="shelf-items">
              {shelf.items.length > 0 ? (
                shelf.items.map((item, itemIndex) => (
                  <div
                    key={item.stream_id || item.series_id || itemIndex}
                    className={`shelf-item ${
                      !onMenu && shelfFocus === shelfIndex && itemFocus === itemIndex 
                        ? 'focused' 
                        : ''
                    }`}
                    onClick={() => handleItemClick(item, shelf.type)}
                  >
                    <div className="item-poster">
                      <img
                        src={item.stream_icon || item.cover || '/images/placeholder.jpg'}
                        alt={item.name}
                        onError={(e) => {
                          e.target.src = '/images/BIGTV-transparente.png';
                        }}
                      />
                      <div className="item-overlay">
                        <i className="fa-solid fa-play"></i>
                      </div>
                    </div>
                    <h3 className="item-title">{item.name}</h3>
                    {item.rating && (
                      <div className="item-rating">
                        <i className="fa-solid fa-star"></i>
                        <span>{item.rating}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="shelf-empty">
                  <i className="fa-solid fa-film"></i>
                  <p>Nenhum conteúdo disponível</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Home; 