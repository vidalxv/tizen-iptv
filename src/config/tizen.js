// Configurações específicas para Tizen 8
export const TIZEN_CONFIG = {
  // Detectar se está executando no Tizen
  isTizen: () => typeof window !== 'undefined' && window.tizen,
  
  // Detectar TV Samsung
  isTV: () => {
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent;
    return (
      window.tizen ||
      userAgent.includes('SMART-TV') ||
      userAgent.includes('Tizen') ||
      userAgent.includes('Samsung')
    );
  },

  // Configurações de player otimizadas para Tizen
  videoConfig: {
    // Formatos suportados em ordem de prioridade para TV
    supportedFormats: {
      live: ['.ts', '.m3u8'],
      vod: ['.mp4', '.m3u8']
    },
    
    // Configurações de timeout
    loadTimeout: 15000,
    retryAttempts: 3,
    retryDelay: 1000,
    
    // Configurações específicas do elemento video para Tizen
    videoElementConfig: {
      autoplay: true,
      preload: 'auto',
      crossOrigin: 'anonymous',
      playsInline: true
    }
  },

  // URLs da API IPTV com fallbacks
  apiConfig: {
    baseUrl: 'https://rota66.bar',
    endpoints: {
      live: (username, password, streamId, format = 'ts') => 
        `https://rota66.bar/live/${username}/${password}/${streamId}.${format}`,
      movie: (username, password, streamId, format = 'mp4') => 
        `https://rota66.bar/${username}/${password}/${streamId}`,
      series: (username, password, streamId, format = 'mp4') => 
        `https://rota66.bar/series/${username}/${password}/${streamId}.${format}`
    }
  },

  // Configurações de navegação por controle remoto
  keyMappings: {
    // Teclas padrão
    ENTER: 13,
    SPACE: 32,
    BACK: 8,
    RETURN: 10009,
    
    // Setas direcionais
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    
    // Controles de media
    PLAY: 415,
    PAUSE: 19,
    STOP: 413,
    REWIND: 412,
    FAST_FORWARD: 417,
    
    // Volume
    VOLUME_UP: 447,
    VOLUME_DOWN: 448,
    MUTE: 449,
    
    // Outras teclas úteis
    INFO: 457,
    MENU: 18,
    EXIT: 27
  },

  // Configurações de performance para Tizen
  performance: {
    // Reduzir qualidade de imagem se necessário
    imageOptimization: true,
    
    // Lazy loading para listas grandes
    lazyLoading: true,
    
    // Cache de imagens
    enableImageCache: true,
    
    // Garbage collection manual
    manualGC: true
  },

  // Configurações de debug
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    showVideoInfo: true,
    showNetworkInfo: true
  }
};

// Utilitários para Tizen
export const TizenUtils = {
  // Log otimizado que não afeta performance
  log: (level, message, data = null) => {
    if (!TIZEN_CONFIG.debug.enabled) return;
    
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(TIZEN_CONFIG.debug.logLevel);
    const messageLevel = levels.indexOf(level);
    
    if (messageLevel >= configLevel) {
      const timestamp = new Date().toISOString();
      console[level](`[TIZEN ${timestamp}] ${message}`, data || '');
    }
  },

  // Detectar capacidades do dispositivo
  getDeviceCapabilities: () => {
    const capabilities = {
      isTV: TIZEN_CONFIG.isTV(),
      isTizen: TIZEN_CONFIG.isTizen(),
      userAgent: navigator.userAgent,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      video: {
        canPlayH264: false,
        canPlayHLS: false,
        canPlayMP4: false
      }
    };

    // Testar formatos de vídeo suportados
    const video = document.createElement('video');
    capabilities.video.canPlayH264 = video.canPlayType('video/mp4; codecs="avc1.640029"') !== '';
    capabilities.video.canPlayHLS = video.canPlayType('application/vnd.apple.mpegurl') !== '';
    capabilities.video.canPlayMP4 = video.canPlayType('video/mp4') !== '';

    return capabilities;
  },

  // Gerar URLs com fallback automático
  generateStreamUrls: (baseUrl, streamId, type = 'live') => {
    const isTV = TIZEN_CONFIG.isTV();
    const formats = TIZEN_CONFIG.videoConfig.supportedFormats[type] || ['.mp4'];
    
    return formats.map(format => 
      `${baseUrl}/${streamId}${format}`
    ).sort((a, b) => {
      // Priorizar formatos baseado no dispositivo
      if (isTV) {
        // Para TV: priorizar .ts para live, .mp4 para VOD
        if (type === 'live') {
          return a.includes('.ts') ? -1 : 1;
        } else {
          return a.includes('.mp4') ? -1 : 1;
        }
      } else {
        // Para desktop: priorizar .m3u8
        return a.includes('.m3u8') ? -1 : 1;
      }
    });
  },

  // Otimizações de memória
  optimizeMemory: () => {
    if (TIZEN_CONFIG.performance.manualGC && window.gc) {
      try {
        window.gc();
        TizenUtils.log('debug', 'Manual garbage collection executed');
      } catch (e) {
        TizenUtils.log('warn', 'Manual GC not available', e);
      }
    }
  },

  // Configurar elemento de vídeo para Tizen
  configureVideoElement: (videoElement) => {
    if (!videoElement) return;

    const config = TIZEN_CONFIG.videoConfig.videoElementConfig;
    
    Object.keys(config).forEach(key => {
      if (key === 'crossOrigin') {
        videoElement.crossOrigin = config[key];
      } else {
        videoElement.setAttribute(key, config[key]);
      }
    });

    // Remover controles nativos se for TV
    if (TIZEN_CONFIG.isTV()) {
      videoElement.removeAttribute('controls');
    }

    TizenUtils.log('debug', 'Video element configured for Tizen', config);
  }
};

export default TIZEN_CONFIG; 