// IPTV API Service
// Baseado no sistema original do APP-bigtv-main

const API_BASE_URL = 'https://rota66.bar/player_api.php';
const API_CREDENTIALS = {
  username: 'zBB82J',
  password: 'AMeDHq'
};

// URLs da API (migradas do app antigo)
export const API_ENDPOINTS = {
  // Categorias
  vodCategories: `${API_BASE_URL}?username=${API_CREDENTIALS.username}&password=${API_CREDENTIALS.password}&action=get_vod_categories`,
  seriesCategories: `${API_BASE_URL}?username=${API_CREDENTIALS.username}&password=${API_CREDENTIALS.password}&action=get_series_categories`,
  liveCategories: `${API_BASE_URL}?username=${API_CREDENTIALS.username}&password=${API_CREDENTIALS.password}&action=get_live_categories`,
  
  // Conteúdo específico (IDs do app antigo)
  lancamentos: `${API_BASE_URL}?username=${API_CREDENTIALS.username}&password=${API_CREDENTIALS.password}&action=get_vod_streams&category_id=82`,
  telenovelas: `${API_BASE_URL}?username=${API_CREDENTIALS.username}&password=${API_CREDENTIALS.password}&action=get_series&category_id=81`,
  classicos: `${API_BASE_URL}?username=${API_CREDENTIALS.username}&password=${API_CREDENTIALS.password}&action=get_vod_streams&category_id=50`,
};

// Função para construir URLs dinâmicas
export const buildApiUrl = (action, categoryId = null) => {
  let url = `${API_BASE_URL}?username=${API_CREDENTIALS.username}&password=${API_CREDENTIALS.password}&action=${action}`;
  if (categoryId) {
    url += `&category_id=${categoryId}`;
  }
  return url;
};

// Função genérica para fazer requisições
const fetchApiData = async (url) => {
  try {
    console.log('Fetching:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados da API:', error);
    throw error;
  }
};

// Serviços específicos
export const iptvApi = {
  // Categorias
  getVodCategories: () => fetchApiData(API_ENDPOINTS.vodCategories),
  getSeriesCategories: () => fetchApiData(API_ENDPOINTS.seriesCategories),
  getLiveCategories: () => fetchApiData(API_ENDPOINTS.liveCategories),
  
  // Conteúdo por categoria
  getVodStreams: (categoryId) => fetchApiData(buildApiUrl('get_vod_streams', categoryId)),
  getSeries: (categoryId) => fetchApiData(buildApiUrl('get_series', categoryId)),
  getLiveStreams: (categoryId) => fetchApiData(buildApiUrl('get_live_streams', categoryId)),
  
  // Conteúdo específico (home)
  getLancamentos: () => fetchApiData(API_ENDPOINTS.lancamentos),
  getTelenovelas: () => fetchApiData(API_ENDPOINTS.telenovelas),
  getClassicos: () => fetchApiData(API_ENDPOINTS.classicos),
  
  // Busca (para implementar no futuro)
  search: (query) => {
    // TODO: Implementar busca quando disponível na API
    console.log('Search not implemented yet:', query);
    return Promise.resolve([]);
  }
};

export default iptvApi; 