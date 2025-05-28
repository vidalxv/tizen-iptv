import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Channels.css';

const Channels = ({ isActive }) => {
  const [categories, setCategories] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(false);
  
  // Estados de navegação
  const [focusArea, setFocusArea] = useState('categories'); // 'categories' ou 'channels'
  const [categoryFocus, setCategoryFocus] = useState(0);
  const [channelFocus, setChannelFocus] = useState(0);

  // Referencias para navegação
  const categoriesRef = useRef([]);
  const channelsRef = useRef([]);
  const containerRef = useRef(null);

  const API_BASE_URL = 'https://rota66.bar/player_api.php';
  const API_CREDENTIALS = 'username=zBB82J&password=AMeDHq';

  // Carregar categorias de canais ao vivo
  useEffect(() => {
    if (isActive) {
      loadLiveCategories();
    }
  }, [isActive]);

  // Sistema de navegação por controle remoto
  useEffect(() => {
    if (!isActive) return;

    const handleChannelsNavigation = (event) => {
      const { keyCode } = event.detail;
      
      if (focusArea === 'categories') {
        handleCategoriesNavigation(keyCode);
      } else if (focusArea === 'channels') {
        handleChannelsNavigationInternal(keyCode);
      }
    };

    window.addEventListener('channelsNavigation', handleChannelsNavigation);
    return () => window.removeEventListener('channelsNavigation', handleChannelsNavigation);
  }, [isActive, focusArea, categoryFocus, channelFocus, categories, channels]);

  const updateFocusVisual = useCallback(() => {
    // Remover foco de todos os elementos
    document.querySelectorAll('.channel, .category-button').forEach(el => {
      el.classList.remove('focused');
    });

    // Adicionar foco ao elemento atual
    if (focusArea === 'categories' && categoriesRef.current[categoryFocus]) {
      categoriesRef.current[categoryFocus].classList.add('focused');
      categoriesRef.current[categoryFocus].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    } else if (focusArea === 'channels' && channelsRef.current[channelFocus]) {
      channelsRef.current[channelFocus].classList.add('focused');
      channelsRef.current[channelFocus].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [focusArea, categoryFocus, channelFocus]);

  // Atualizar foco visual
  useEffect(() => {
    updateFocusVisual();
  }, [updateFocusVisual]);

  const handleCategoriesNavigation = (keyCode) => {
    if (keyCode === 38) { // Cima
      setCategoryFocus(prev => (prev > 0 ? prev - 1 : categories.length - 1));
    } else if (keyCode === 40) { // Baixo
      setCategoryFocus(prev => (prev < categories.length - 1 ? prev + 1 : 0));
    } else if (keyCode === 39) { // Direita - ir para canais
      if (channels.length > 0) {
        setFocusArea('channels');
        setChannelFocus(0);
      }
    } else if (keyCode === 13) { // OK - selecionar categoria
      if (categories[categoryFocus]) {
        handleCategoryClick(categories[categoryFocus].category_id);
      }
    }
  };

  const handleChannelsNavigationInternal = (keyCode) => {
    const channelsPerRow = Math.floor((window.innerWidth - 320) / 200); // Aproximação
    const totalChannels = channels.length;
    
    if (keyCode === 38) { // Cima
      const newFocus = channelFocus - channelsPerRow;
      setChannelFocus(newFocus >= 0 ? newFocus : channelFocus);
    } else if (keyCode === 40) { // Baixo
      const newFocus = channelFocus + channelsPerRow;
      setChannelFocus(newFocus < totalChannels ? newFocus : channelFocus);
    } else if (keyCode === 37) { // Esquerda
      if (channelFocus % channelsPerRow === 0) {
        // Se estiver na primeira coluna, voltar para categorias
        setFocusArea('categories');
      } else {
        setChannelFocus(prev => (prev > 0 ? prev - 1 : 0));
      }
    } else if (keyCode === 39) { // Direita
      setChannelFocus(prev => (prev < totalChannels - 1 ? prev + 1 : prev));
    } else if (keyCode === 13) { // OK - selecionar canal
      if (channels[channelFocus]) {
        handleChannelSelect(channels[channelFocus]);
      }
    }
  };

  const loadLiveCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}?${API_CREDENTIALS}&action=get_live_categories`
      );
      const data = await response.json();
      setCategories(data);
      
      // Selecionar primeira categoria automaticamente
      if (data.length > 0) {
        setSelectedCategory(data[0].category_id);
        setCategoryFocus(0);
        loadLiveChannels(data[0].category_id);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveChannels = async (categoryId) => {
    setChannelsLoading(true);
    setChannelFocus(0); // Reset channel focus
    try {
      const response = await fetch(
        `${API_BASE_URL}?${API_CREDENTIALS}&action=get_live_streams&category_id=${categoryId}`
      );
      const data = await response.json();
      setChannels(data);
      
      // Se estivermos no grid de canais, voltar o foco para os canais
      if (focusArea === 'channels') {
        setChannelFocus(0);
      }
    } catch (error) {
      console.error('Erro ao carregar canais:', error);
      setChannels([]);
    } finally {
      setChannelsLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    const categoryIndex = categories.findIndex(cat => cat.category_id === categoryId);
    setCategoryFocus(categoryIndex);
    loadLiveChannels(categoryId);
    setFocusArea('channels'); // Mover foco para os canais
  };

  const handleChannelSelect = (channel) => {
    console.log('Canal selecionado:', channel);
    
    // Construir URL do stream
    const streamUrl = `https://rota66.bar/live/${API_CREDENTIALS.split('&')[0].split('=')[1]}/${API_CREDENTIALS.split('&')[1].split('=')[1]}/${channel.stream_id}.ts`;
    
    // Informações do canal para o player
    const streamInfo = {
      name: channel.name,
      category: selectedCategory ? categories.find(cat => cat.category_id === selectedCategory)?.category_name : 'Canal',
      description: `Canal ao vivo - ${channel.name}`,
      type: 'live'
    };

    // Disparar evento para reproduzir no VideoPlayer
    const playEvent = new CustomEvent('playContent', {
      detail: { streamUrl, streamInfo }
    });
    window.dispatchEvent(playEvent);
  };

  // Função para tratar erros de imagem
  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  if (!isActive) return null;

  return (
    <div className="channels-container" ref={containerRef}>
      <div className="channels-layout">
        {/* Lista de Categorias */}
        <div className="categories">
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

        {/* Grid de Canais */}
        <div className="channels-display">
          {channelsLoading ? (
            <div className="loading">Carregando canais...</div>
          ) : channels.length > 0 ? (
            channels.map((channel, index) => (
              <div
                key={channel.stream_id}
                ref={el => channelsRef.current[index] = el}
                className="channel"
                onClick={() => handleChannelSelect(channel)}
                data-focusable="true"
                data-channel={channel.stream_id}
              >
                {channel.stream_icon && (
                  <img
                    src={channel.stream_icon}
                    alt={channel.name}
                    onError={handleImageError}
                  />
                )}
                <p>{channel.name}</p>
              </div>
            ))
          ) : (
            <div className="no-content">
              Nenhum canal encontrado nesta categoria
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Channels; 