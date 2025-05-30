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

  // Estados de paginação ( مشابه a Series.js/Movies.js )
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 15; // Ajuste conforme o layout de canais (ex: 5 colunas x 3 linhas)
  const GRID_COLUMNS = 5; // Ajuste conforme o layout de canais
  const GRID_ROWS = 3; // Ajuste conforme o layout de canais

  // Referencias para navegação
  const categoriesRef = useRef([]);
  const channelsRef = useRef([]);
  const containerRef = useRef(null);

  const API_BASE_URL = 'https://rota66.bar/player_api.php';
  const API_CREDENTIALS = 'username=zBB82J&password=AMeDHq';

  // Função para carregar categorias de canais ao vivo
  const loadLiveCategories = useCallback(async () => {
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
        // Chamada direta para evitar dependência circular
        const categoryId = data[0].category_id;
        setChannelsLoading(true);
        setChannelFocus(0);
        setCurrentPage(0);
        try {
          const channelsResponse = await fetch(
            `${API_BASE_URL}?${API_CREDENTIALS}&action=get_live_streams&category_id=${categoryId}`
          );
          const channelsData = await channelsResponse.json();
          setChannels(channelsData);
        } catch (channelsError) {
          console.error('Erro ao carregar canais:', channelsError);
          setChannels([]);
        } finally {
          setChannelsLoading(false);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, API_CREDENTIALS]);

  // Função para carregar canais de uma categoria
  const loadLiveChannels = useCallback(async (categoryId) => {
    setChannelsLoading(true);
    setChannelFocus(0); // Reset channel focus
    setCurrentPage(0); // Resetar para primeira página
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
  }, [API_BASE_URL, API_CREDENTIALS, focusArea]);

  // Calcular canais da página atual
  const getCurrentPageChannels = useCallback(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return channels.slice(startIndex, endIndex);
  }, [currentPage, channels]);

  const totalPages = Math.ceil(channels.length / ITEMS_PER_PAGE);
  const currentPageChannels = getCurrentPageChannels();

  // Função para selecionar canal
  const handleChannelSelect = useCallback((channel) => {
    console.log('Canal selecionado:', channel);
    
    // Construir URL do stream com a estrutura correta
    const streamUrl = `https://rota66.bar/${API_CREDENTIALS.split('&')[0].split('=')[1]}/${API_CREDENTIALS.split('&')[1].split('=')[1]}/${channel.stream_id}`;
    
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
  }, [API_CREDENTIALS, selectedCategory, categories]);

  // Função para clicar em categoria
  const handleCategoryClick = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    const categoryIndex = categories.findIndex(cat => cat.category_id === categoryId);
    setCategoryFocus(categoryIndex);
    loadLiveChannels(categoryId); // loadLiveChannels já reseta currentPage
    setFocusArea('channels'); // Mover foco para os canais
  }, [categories, loadLiveChannels]);

  // Carregar categorias de canais ao vivo
  useEffect(() => {
    if (isActive) {
      loadLiveCategories();
    }
  }, [isActive, loadLiveCategories]);

  // Função de navegação das categorias
  const handleCategoriesNavigation = useCallback((keyCode) => {
    if (keyCode === 38) { // Cima
      setCategoryFocus(prev => (prev > 0 ? prev - 1 : categories.length - 1));
    } else if (keyCode === 40) { // Baixo
      setCategoryFocus(prev => (prev < categories.length - 1 ? prev + 1 : 0));
    } else if (keyCode === 37) { // Esquerda - voltar para sidebar
      const backEvent = new CustomEvent('backToSidebar');
      window.dispatchEvent(backEvent);
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
  }, [categories, categoryFocus, channels.length, handleCategoryClick]);

  // Função de navegação dos canais
  const handleChannelsNavigationInternal = useCallback((keyCode) => {
    const currentPageChannelsCount = currentPageChannels.length; // Usar canais da página atual

    if (keyCode === 38) { // Cima
      const currentRow = Math.floor(channelFocus / GRID_COLUMNS);
      if (currentRow > 0) {
        const newFocus = Math.max(0, channelFocus - GRID_COLUMNS);
        setChannelFocus(newFocus);
      } else {
        if (currentPage > 0) {
          setCurrentPage(currentPage - 1);
          const currentCol = channelFocus % GRID_COLUMNS;
          const newFocusAttempt = (GRID_ROWS - 1) * GRID_COLUMNS + currentCol;
          const lastPageStartIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          const previousPageChannelsCount = channels.slice(lastPageStartIndex, lastPageStartIndex + ITEMS_PER_PAGE).length;
          setChannelFocus(Math.min(newFocusAttempt, previousPageChannelsCount - 1));
        }
      }
    } else if (keyCode === 40) { // Baixo
      const currentRow = Math.floor(channelFocus / GRID_COLUMNS);
      const maxRow = Math.floor((currentPageChannelsCount - 1) / GRID_COLUMNS);
      if (currentRow < maxRow) {
        const newFocus = Math.min(currentPageChannelsCount - 1, channelFocus + GRID_COLUMNS);
        setChannelFocus(newFocus);
      } else {
        if (currentPage < totalPages - 1) {
          setCurrentPage(currentPage + 1);
          setChannelFocus(channelFocus % GRID_COLUMNS);
        }
      }
    } else if (keyCode === 37) { // Esquerda
      const currentCol = channelFocus % GRID_COLUMNS;
      if (currentCol > 0) {
        setChannelFocus(channelFocus - 1);
      } else {
        setFocusArea('categories');
        const selectedIndex = categories.findIndex(cat => cat.category_id === selectedCategory);
        setCategoryFocus(selectedIndex >= 0 ? selectedIndex : 0);
      }
    } else if (keyCode === 39) { // Direita
      const currentCol = channelFocus % GRID_COLUMNS;
      if (currentCol < GRID_COLUMNS - 1 && channelFocus < currentPageChannelsCount - 1) {
        setChannelFocus(channelFocus + 1);
      } else {
        if (currentPage < totalPages - 1 && currentCol === GRID_COLUMNS - 1) {
            setCurrentPage(currentPage + 1);
            const newRow = Math.floor(channelFocus / GRID_COLUMNS);
            setChannelFocus(newRow * GRID_COLUMNS);
        }
      }
    } else if (keyCode === 13) { // OK - selecionar canal
      if (currentPageChannels[channelFocus]) {
        const actualChannelIndex = currentPage * ITEMS_PER_PAGE + channelFocus;
        handleChannelSelect(channels[actualChannelIndex]);
      }
    }
  }, [
    currentPageChannels,
    channelFocus,
    currentPage,
    totalPages,
    channels,
    categories,
    selectedCategory,
    handleChannelSelect
  ]);

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
  }, [isActive, focusArea, handleCategoriesNavigation, handleChannelsNavigationInternal]);

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

  // Função para tratar erros de imagem
  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  if (!isActive) return null;

  return (
    <div className="channels-container" ref={containerRef}>
      <div className="channels-layout">
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

        {/* Grid de Canais */}
        <div className="content-grid">
          {channelsLoading ? (
            <div className="loading">Carregando canais...</div>
          ) : channels.length > 0 ? (
            <>
              {totalPages > 1 && (
                <div className="pagination-info"> {/* Estilo de Series.css */} 
                  <span>Página {currentPage + 1} de {totalPages}</span>
                  <span className="channels-count"> {/* Pode precisar de um estilo específico ou usar series-count */} 
                    {channels.length} canais • {currentPageChannels.length} nesta página
                  </span>
                </div>
              )}
              {currentPageChannels.map((channel, index) => ( // Mapear currentPageChannels
                <div
                  key={channel.stream_id}
                  ref={el => channelsRef.current[index] = el} // Manter ref para os itens visíveis
                  className="channel"
                  onClick={() => {
                    // Ajustar o índice para o array original de canais se necessário para handleChannelSelect
                    const actualChannelIndex = currentPage * ITEMS_PER_PAGE + index;
                    handleChannelSelect(channels[actualChannelIndex]);
                  }}
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
              ))}
            </>
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