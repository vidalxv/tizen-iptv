import React, { useRef, useEffect, useState } from 'react';
import mpegts from 'mpegts.js';
import './VideoPlayer.css';

const VideoPlayer = ({ isActive, streamUrl, streamInfo, onBack }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState(null);

  // Estados para overlay
  const [showOverlay, setShowOverlay] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Sistema de navegação por controle remoto
  useEffect(() => {
    if (!isActive) return;

    const handlePlayerNavigation = (event) => {
      const { keyCode } = event.detail;
      
      // Mostrar controles quando navegar
      showControlsTemporary();
      
      if (keyCode === 32 || keyCode === 13) { // Espaço ou OK - Play/Pause
        togglePlayPause();
      } else if (keyCode === 8 || keyCode === 10009) { // Back/Return
        handleBack();
      } else if (keyCode === 38) { // Cima - Aumentar volume
        adjustVolume(0.1);
      } else if (keyCode === 40) { // Baixo - Diminuir volume
        adjustVolume(-0.1);
      } else if (keyCode === 77) { // M - Mute
        toggleMute();
      } else if (keyCode === 73) { // I - Toggle info overlay
        setShowOverlay(prev => !prev);
      }
    };

    window.addEventListener('playerNavigation', handlePlayerNavigation);
    return () => window.removeEventListener('playerNavigation', handlePlayerNavigation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPlaying, volume, isMuted]);

  // Atualizar relógio
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Inicializar player quando componente fica ativo
  useEffect(() => {
    if (isActive && streamUrl) {
      initializePlayer();
    } else {
      destroyPlayer();
    }

    return () => destroyPlayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, streamUrl]);

  // Auto-hide controles
  useEffect(() => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    if (showControls && isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 5000); // Esconder após 5 segundos
      
      setControlsTimeout(timeout);
    }

    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showControls, isPlaying]);

  const initializePlayer = async () => {
    if (!videoRef.current || !streamUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      // Destruir player anterior se existir
      destroyPlayer();

      // Determinar se é um stream ao vivo ou vídeo on-demand
      const isLiveStream = streamUrl.includes('.ts');
      const isVideoFile = streamUrl.includes('.mp4') || streamUrl.includes('.m3u8');

      if (isLiveStream) {
        // Para streams .ts (canais ao vivo), usar mpegts.js
        if (!mpegts.isSupported()) {
          throw new Error('Seu navegador não suporta reprodução de streams MPEG-TS');
        }

        const player = mpegts.createPlayer({
          type: 'mse',
          isLive: true,
          url: streamUrl
        }, {
          enableWorker: false,
          lazyLoadMaxDuration: 3 * 60,
          liveBufferLatencyChasing: true,
          liveSync: true
        });

        // Event listeners do mpegts.js
        player.on(mpegts.Events.ERROR, (errorType, errorDetail, errorInfo) => {
          console.error('Player error:', errorType, errorDetail, errorInfo);
          setError('Erro ao reproduzir stream. Verifique a conexão.');
          setIsLoading(false);
        });

        player.on(mpegts.Events.LOADING_COMPLETE, () => {
          setIsLoading(false);
        });

        player.on(mpegts.Events.MEDIA_INFO, (mediaInfo) => {
          console.log('Media info:', mediaInfo);
        });

        // Anexar ao elemento video
        player.attachMediaElement(videoRef.current);
        player.load();

        // Salvar referência
        playerRef.current = player;
      } else if (isVideoFile) {
        // Para arquivos de vídeo (.mp4), usar elemento video nativo
        const videoElement = videoRef.current;
        videoElement.src = streamUrl;
        videoElement.load();
        
        // Não salvar referência do player para vídeos nativos
        playerRef.current = null;
      } else {
        throw new Error('Formato de stream não suportado');
      }

      // Event listeners do elemento video (aplicados em ambos os casos)
      const videoElement = videoRef.current;
      
      // Remover listeners antigos
      videoElement.removeEventListener('loadstart', handleLoadStart);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleVideoError);
      
      // Adicionar listeners
      videoElement.addEventListener('loadstart', handleLoadStart);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('playing', handlePlaying);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('ended', handleEnded);
      videoElement.addEventListener('error', handleVideoError);

    } catch (err) {
      console.error('Failed to initialize player:', err);
      setError(err.message || 'Erro ao inicializar player');
      setIsLoading(false);
    }
  };

  // Handlers para eventos do vídeo
  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    // Auto-play
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Auto-play failed:', err);
        setIsLoading(false);
      });
    }
  };

  const handlePlaying = () => {
    setIsPlaying(true);
    setIsLoading(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleVideoError = (e) => {
    console.error('Video error:', e);
    setError('Erro ao reproduzir vídeo');
    setIsLoading(false);
  };

  const destroyPlayer = () => {
    // Remover listeners do elemento video
    if (videoRef.current) {
      const videoElement = videoRef.current;
      videoElement.removeEventListener('loadstart', handleLoadStart);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleVideoError);
    }

    // Destruir player mpegts.js se existir
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.unload();
        playerRef.current.detachMediaElement();
        playerRef.current.destroy();
      } catch (err) {
        console.error('Error destroying player:', err);
      } finally {
        playerRef.current = null;
      }
    }
    
    setIsPlaying(false);
    setIsLoading(false);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
        console.error('Play failed:', err);
        setError('Não foi possível reproduzir o vídeo');
      });
    }
  };

  const adjustVolume = (delta) => {
    if (!videoRef.current) return;

    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;

    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const handleBack = () => {
    destroyPlayer();
    if (onBack) {
      onBack();
    }
  };

  const showControlsTemporary = () => {
    setShowControls(true);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return 'fa-volume-mute';
    if (volume < 0.5) return 'fa-volume-low';
    return 'fa-volume-high';
  };

  if (!isActive) return null;

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="video-element"
          autoPlay
          muted={isMuted}
          onMouseMove={showControlsTemporary}
          onClick={showControlsTemporary}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
            <p>Carregando stream...</p>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="error-overlay">
            <div className="error-content">
              <i className="fa-solid fa-exclamation-triangle"></i>
              <h3>Erro de Reprodução</h3>
              <p>{error}</p>
              <button className="retry-button" onClick={initializePlayer}>
                <i className="fa-solid fa-refresh"></i>
                Tentar Novamente
              </button>
            </div>
          </div>
        )}

        {/* Info Overlay */}
        {showOverlay && streamInfo && (
          <div className="info-overlay">
            <div className="stream-info">
              <h2>{streamInfo.name}</h2>
              {streamInfo.category && (
                <p className="stream-category">{streamInfo.category}</p>
              )}
              {streamInfo.description && (
                <p className="stream-description">{streamInfo.description}</p>
              )}
            </div>
            <div className="time-info">
              <span className="current-time">{formatTime(currentTime)}</span>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <div className="controls-overlay">
            <div className="controls-top">
              <button className="back-button" onClick={handleBack}>
                <i className="fa-solid fa-arrow-left"></i>
                Voltar
              </button>
              <button className="info-button" onClick={() => setShowOverlay(!showOverlay)}>
                <i className="fa-solid fa-info-circle"></i>
                Info
              </button>
            </div>

            <div className="controls-center">
              <button className="play-pause-button" onClick={togglePlayPause}>
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
              </button>
            </div>

            <div className="controls-bottom">
              <div className="volume-control">
                <button className="mute-button" onClick={toggleMute}>
                  <i className={`fa-solid ${getVolumeIcon()}`}></i>
                </button>
                <div className="volume-bar">
                  <div 
                    className="volume-fill" 
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  ></div>
                </div>
                <span className="volume-text">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>

              <div className="player-info">
                {isLoading && <span className="status">Carregando...</span>}
                {!isLoading && !error && (
                  <span className="status">
                    {isPlaying ? 'Reproduzindo' : 'Pausado'}
                  </span>
                )}
                {error && <span className="status error-status">Erro</span>}
              </div>
            </div>
          </div>
        )}

        {/* Help Overlay (sempre visível quando controles estão visíveis) */}
        {showControls && (
          <div className="help-overlay">
            <div className="help-text">
              <span>OK/ESPAÇO: Play/Pause</span>
              <span>↑↓: Volume</span>
              <span>M: Mute</span>
              <span>I: Info</span>
              <span>VOLTAR: Sair</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer; 