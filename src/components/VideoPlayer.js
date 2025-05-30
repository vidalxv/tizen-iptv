import React, { useRef, useEffect, useState, useCallback } from 'react';
import mpegts from 'mpegts.js';
import './VideoPlayer.css';

const VideoPlayer = ({ isActive, streamUrl, streamInfo, onBack }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const initializingRef = useRef(false);
  const errorTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const previousStreamUrlRef = useRef(null); // Para evitar re-inicializações desnecessárias
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Iniciando player...');
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerType, setPlayerType] = useState(null);

  // Função para detectar tipo de player necessário
  const detectPlayerType = (url, info) => {
    // TV ao vivo sempre usa mpegts
    if (info?.type === 'live') {
      return 'mpegts';
    }
    
    // Séries e filmes (MP4) usam HTML5
    if (info?.type === 'series' || info?.type === 'movie') {
      return 'html5';
    }
    
    // Fallback: detectar pela URL
    if (url.includes('.mp4') || url.includes('series/') || url.includes('movie/')) {
      return 'html5';
    }
    
    // Padrão: mpegts para streams
    return 'mpegts';
  };

  // Limpar timeouts ativos
  const clearTimeouts = () => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  // Função memoizada para inicialização
  const initializeIfNeeded = useCallback(() => {
    if (!isActive || !streamUrl || initializingRef.current) return;

    // Verificar se a URL mudou, se não mudou e não há erro, não reinicializar
    if (previousStreamUrlRef.current === streamUrl && !error) {
      console.log('Mesma URL e sem erros, não reinicializar');
      return;
    }

    // Verificar se já está reproduzindo para evitar reinicialização
    // Usar refs para verificar status atual sem criar dependências
    if (initializingRef.current) {
      console.log('Já está inicializando, aguardando...');
      return;
    }

    console.log('Iniciando reprodução:', streamUrl);
    
    // Limpar player anterior se existir e a URL mudou
    if (previousStreamUrlRef.current !== streamUrl) {
      console.log('URL mudou, limpando player anterior');
      cleanupPlayer();
    }
    
    previousStreamUrlRef.current = streamUrl; // Atualizar URL anterior
    
    const detectedPlayerType = detectPlayerType(streamUrl, streamInfo);
    console.log('Tipo de player detectado:', detectedPlayerType);
    setPlayerType(detectedPlayerType);
    initializingRef.current = true;

    // Função de inicialização integrada
    const initPlayer = (type) => {
      if (!videoRef.current || !streamUrl) {
        console.log('Não é possível inicializar: elemento video ou URL ausente');
        initializingRef.current = false;
        return;
      }

      console.log(`Inicializando player ${type} com URL:`, streamUrl);
      setIsLoading(true);
      setLoadingMessage('Conectando ao servidor...');
      setError(null);
      setIsPlaying(false);
      
      // Limpar timeouts anteriores
      clearTimeouts();

      const videoElement = videoRef.current;

      try {
        if (type === 'html5') {
          // Usar HTML5 para séries e filmes (MP4)
          console.log('Usando HTML5 player para MP4');
          
          // Event listeners específicos para HTML5
          const handleLoadStart = () => {
            console.log('HTML5: Começou a carregar');
            setLoadingMessage('Carregando vídeo...');
            setIsLoading(true);
            setError(null);
          };

          const handleLoadedData = () => {
            console.log('HTML5: Dados carregados');
            setLoadingMessage('Preparando reprodução...');
          };

          const handleCanPlay = () => {
            console.log('HTML5: Pode reproduzir');
            clearTimeouts();
            setLoadingMessage('Iniciando reprodução...');
          };

          const handleCanPlayThrough = () => {
            console.log('HTML5: Pode reproduzir completamente');
            clearTimeouts();
            setIsLoading(false);
            setError(null);
          };

          const handlePlaying = () => {
            console.log('HTML5: Reproduzindo');
            clearTimeouts();
            setIsPlaying(true);
            setIsLoading(false);
            setError(null);
            initializingRef.current = false; // Inicialização concluída com sucesso
          };

          const handleWaiting = () => {
            console.log('HTML5: Aguardando dados');
            setLoadingMessage('Carregando mais dados...');
            setIsLoading(true);
          };

          const handleError = (err) => {
            console.error('Erro HTML5:', err);
            clearTimeouts();
            setError('Erro ao reproduzir vídeo');
            setIsLoading(false);
            setIsPlaying(false);
            initializingRef.current = false; // Reset flag em caso de erro
          };

          const handleStalled = () => {
            console.log('HTML5: Carregamento pausado');
            setLoadingMessage('Reconectando...');
          };

          // Adicionar todos os event listeners
          videoElement.addEventListener('loadstart', handleLoadStart);
          videoElement.addEventListener('loadeddata', handleLoadedData);
          videoElement.addEventListener('canplay', handleCanPlay);
          videoElement.addEventListener('canplaythrough', handleCanPlayThrough);
          videoElement.addEventListener('playing', handlePlaying);
          videoElement.addEventListener('waiting', handleWaiting);
          videoElement.addEventListener('error', handleError);
          videoElement.addEventListener('stalled', handleStalled);

          // Configurar timeout mais longo para HTML5 (10 segundos)
          errorTimeoutRef.current = setTimeout(() => {
            if (videoRef.current && initializingRef.current) {
              console.log('Timeout HTML5: tentando reproduzir mesmo assim');
              videoRef.current.play().catch(() => {
                setError('Tempo limite excedido para carregar o vídeo');
                setIsLoading(false);
                initializingRef.current = false;
              });
            }
          }, 10000);

          // Configurar e carregar vídeo
          videoElement.src = streamUrl;
          videoElement.load();
          
          // Tentar reproduzir após dados carregados
          videoElement.addEventListener('loadeddata', () => {
            setTimeout(() => {
              // Verificação de segurança antes de reproduzir HTML5
              if (videoRef.current && initializingRef.current) {
                videoRef.current.play().catch(err => {
                  console.error('Erro no auto-play HTML5:', err);
                  // Não mostrar erro imediatamente, aguardar timeout
                });
              } else {
                console.log('Elemento video não disponível para auto-play HTML5');
              }
            }, 1000);
          }, { once: true });

        } else {
          // Usar mpegts.js para TV ao vivo
          console.log('Usando mpegts player para stream');
          setLoadingMessage('Inicializando player de streaming...');
          
          const player = mpegts.createPlayer({
            type: 'mpegts',
            isLive: streamInfo?.type === 'live',
            url: streamUrl
          });

          playerRef.current = player;

          // Event listeners do mpegts
          player.on(mpegts.Events.ERROR, (errorType, errorDetail, errorInfo) => {
            console.error('Erro mpegts:', errorType, errorDetail, errorInfo);
            clearTimeouts();
            setError('Erro ao reproduzir stream');
            setIsLoading(false);
            setIsPlaying(false);
            initializingRef.current = false;
          });

          player.on(mpegts.Events.LOADING_COMPLETE, () => {
            console.log('Carregamento mpegts completo');
            setLoadingMessage('Iniciando reprodução...');
          });

          player.on(mpegts.Events.MEDIA_INFO, () => {
            console.log('Informações de mídia mpegts carregadas');
            setLoadingMessage('Preparando reprodução...');
          });

          // Event listeners do elemento video para mpegts
          const handlePlaying = () => {
            console.log('mpegts: Reproduzindo');
            clearTimeouts();
            setIsPlaying(true);
            setIsLoading(false);
            setError(null);
            initializingRef.current = false; // Inicialização concluída com sucesso
          };

          const handleWaiting = () => {
            console.log('mpegts: Aguardando dados');
            setLoadingMessage('Aguardando dados do stream...');
            setIsLoading(true);
          };

          videoElement.addEventListener('playing', handlePlaying);
          videoElement.addEventListener('waiting', handleWaiting);

          // Timeout para mpegts (8 segundos)
          errorTimeoutRef.current = setTimeout(() => {
            if (playerRef.current && videoRef.current && initializingRef.current) {
              console.log('Timeout mpegts: tentando reproduzir mesmo assim');
              playerRef.current.play().catch(() => {
                setError('Tempo limite excedido para conectar ao stream');
                setIsLoading(false);
                initializingRef.current = false;
              });
            }
          }, 8000);

          // Anexar ao elemento video e carregar
          player.attachMediaElement(videoElement);
          player.load();

          // Auto-play
          setTimeout(() => {
            // Verificação de segurança antes de reproduzir
            if (playerRef.current && videoRef.current && initializingRef.current) {
              playerRef.current.play().then(() => {
                console.log('Reprodução mpegts iniciada');
                setLoadingMessage('Reprodução iniciada');
              }).catch(err => {
                console.error('Erro no auto-play mpegts:', err);
                // Não mostrar erro imediatamente, aguardar timeout
              });
            } else {
              console.log('Player ou elemento video não disponível para auto-play');
            }
          }, 500);
        }

      } catch (err) {
        console.error('Erro ao criar player:', err);
        clearTimeouts();
        setError('Erro ao inicializar player');
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    // Chamar função de inicialização
    initPlayer(detectedPlayerType);
  }, [isActive, streamUrl, streamInfo]); // Removido isPlaying e error das dependências para evitar loop

  // Função para limpar player
  const cleanupPlayer = useCallback(() => {
    // Limpar timeouts ativos
    clearTimeouts();
    
    // Limpar event listeners do elemento video
    if (videoRef.current) {
      const videoElement = videoRef.current;
      
      try {
        // Remover todos os event listeners HTML5
        const events = ['loadstart', 'loadeddata', 'canplay', 'canplaythrough', 'playing', 'waiting', 'error', 'stalled'];
        events.forEach(event => {
          videoElement.removeEventListener(event, () => {});
        });
        
        // Para HTML5, parar e limpar src com verificações de segurança
        if (videoElement.pause && typeof videoElement.pause === 'function') {
          videoElement.pause();
        }
        if (videoElement.src !== undefined) {
          videoElement.src = '';
        }
        if (videoElement.load && typeof videoElement.load === 'function') {
          videoElement.load();
        }
      } catch (err) {
        console.log('Erro ao limpar listeners do video element:', err);
      }
    }

    // Limpar player mpegts se existir
    if (playerRef.current) {
      try {
        const player = playerRef.current;
        
        // Verificações de segurança para métodos do mpegts
        if (player.isLoaded && typeof player.isLoaded === 'function' && player.isLoaded()) {
          if (player.pause && typeof player.pause === 'function') {
            player.pause();
          }
          if (player.unload && typeof player.unload === 'function') {
            player.unload();
          }
        }
        
        // Remover event listeners com verificações
        try { 
          if (player.off && typeof player.off === 'function') {
            player.off(mpegts.Events.ERROR); 
          }
        } catch (e) {
          console.log('Erro ao remover listener ERROR:', e);
        }
        
        try { 
          if (player.off && typeof player.off === 'function') {
            player.off(mpegts.Events.LOADING_COMPLETE); 
          }
        } catch (e) {
          console.log('Erro ao remover listener LOADING_COMPLETE:', e);
        }
        
        try { 
          if (player.off && typeof player.off === 'function') {
            player.off(mpegts.Events.MEDIA_INFO); 
          }
        } catch (e) {
          console.log('Erro ao remover listener MEDIA_INFO:', e);
        }
        
        // Detach e destroy com verificações
        if (player.detachMediaElement && typeof player.detachMediaElement === 'function') {
          player.detachMediaElement();
        }
        
        if (player.destroy && typeof player.destroy === 'function') {
          player.destroy();
        }
        
        console.log('Player mpegts limpo com segurança');
      } catch (err) {
        console.error('Erro ao limpar player mpegts:', err);
      }
      
      playerRef.current = null;
    }
    
    setIsLoading(false);
    setLoadingMessage('Iniciando player...');
    setError(null);
    setIsPlaying(false);
    setPlayerType(null);
    initializingRef.current = false; // Resetar flag
    previousStreamUrlRef.current = null; // Resetar URL anterior
  }, []); // Sem dependências pois usa apenas refs e setters de estado

  // Função para voltar/sair
  const handleBack = useCallback(() => {
    cleanupPlayer();
    if (onBack) {
      onBack();
    }
  }, [cleanupPlayer, onBack]);

  useEffect(() => {
    // Só inicializar se realmente for necessário
    if (isActive && streamUrl && !initializingRef.current) {
      initializeIfNeeded();
    }

    return () => {
      if (!isActive) {
        cleanupPlayer();
      }
    };
  }, [isActive, streamUrl, initializeIfNeeded, cleanupPlayer]);

  // Sistema de navegação por controle remoto
  useEffect(() => {
    if (!isActive) return;

    const handlePlayerNavigation = (event) => {
      const { keyCode } = event.detail;
      
      if (keyCode === 8 || keyCode === 10009) { // Back/Return
        handleBack();
      }
    };

    window.addEventListener('playerNavigation', handlePlayerNavigation);
    return () => window.removeEventListener('playerNavigation', handlePlayerNavigation);
  }, [isActive, handleBack]);

  const retryPlayback = () => {
    console.log('Tentando reproduzir novamente...');
    setError(null);
    setIsLoading(true);
    setLoadingMessage('Reiniciando player...');
    setIsPlaying(false);
    
    // Reset da flag de inicialização para permitir nova inicialização
    initializingRef.current = false;
    
    cleanupPlayer();
    
    retryTimeoutRef.current = setTimeout(() => {
      if (isActive && streamUrl) {
        const detectedPlayerType = detectPlayerType(streamUrl, streamInfo);
        setPlayerType(detectedPlayerType);
        setLoadingMessage('Conectando novamente...');
        initializeIfNeeded();
      }
    }, 1000);
  };

  if (!isActive) return null;

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="video-element"
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%' }}
        />

        {/* Loading Overlay */}
        {isLoading && !isPlaying && (
          <div className="loading-overlay">
            <div className="loading-spinner">⏳</div>
            <p className="loading-message">{loadingMessage}</p>
            <p className="loading-player-info">
              {playerType === 'html5' ? 'Player HTML5' : playerType === 'mpegts' ? 'Player mpegts.js' : 'Detectando...'}
            </p>
            {streamInfo && (
              <p className="loading-content-info">
                {streamInfo.type === 'series' ? 'Série' : 
                 streamInfo.type === 'movie' ? 'Filme' : 
                 streamInfo.type === 'live' ? 'TV ao Vivo' : 'Conteúdo'}
              </p>
            )}
          </div>
        )}

        {/* Error Overlay */}
        {error && !isPlaying && (
          <div className="error-overlay">
            <div className="error-content">
              <h3>Erro na Reprodução</h3>
              <p>{error}</p>
              <p className="player-info">Player usado: {playerType === 'html5' ? 'HTML5' : 'mpegts.js'}</p>
              <div className="error-actions">
                <button onClick={retryPlayback} className="retry-button">
                  Tentar Novamente
                </button>
                <button onClick={handleBack} className="back-button">
                  Voltar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stream Info Overlay */}
        {streamInfo && isPlaying && (
          <div className="stream-info-overlay">
            <div className="stream-info">
              <h2>{streamInfo.name}</h2>
              {streamInfo.category && (
                <p className="category">{streamInfo.category}</p>
              )}
              <p className="player-info">Player: {playerType === 'html5' ? 'HTML5' : 'mpegts.js'}</p>
              <p className="instructions">Pressione BACK para voltar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer; 