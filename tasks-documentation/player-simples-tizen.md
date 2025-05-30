# Player Simples para Tizen 8

## Objetivo
Criar um player de vídeo muito simples e funcional para Tizen 8, focado apenas na reprodução de:
- Canais ao vivo (IPTV)
- Filmes 
- Séries

## Requisitos
- Sem funcionalidades complexas (sem pause, sem controles avançados)
- Apenas reprodução básica
- Otimizado para Tizen 8
- Suporte total para streams IPTV
- Foco na estabilidade e simplicidade

## Tarefas
- [x] Criar novo VideoPlayer.js simples
- [x] ~~Remover dependência mpegts.js desnecessária~~
- [x] Implementar navegação básica (voltar)
- [x] Simplificar CSS para melhor performance
- [x] **PROBLEMA ENCONTRADO**: Formato não suportado
- [x] **SOLUÇÃO**: Usar mpegts.js para todos os streams
- [x] **BUG CORRIGIDO**: Erro de cleanup de event listeners
- [x] **BUG CORRIGIDO**: Overlay de erro aparecendo quando vídeo está reproduzindo
- [x] **BUG CORRIGIDO**: URL incorreta para séries (HTTP 405) - Series.js
- [x] **BUG CORRIGIDO**: URL incorreta para séries (HTTP 405) - SeriesDetailsPage.js
- [x] **DESCOBERTA CRUCIAL**: mpegts.js não suporta MP4
- [x] **SOLUÇÃO FINAL**: Player híbrido (mpegts.js + HTML5)

## Solução Final: Player Híbrido

### Por que Player Híbrido?
Descobrimos que **diferentes tipos de conteúdo usam formatos diferentes**:
- **TV ao vivo**: Streams em tempo real (compatível com mpegts.js)
- **Séries e Filmes**: Arquivos MP4 (incompatível com mpegts.js)

**mpegts.js** apenas suporta:
- ✅ MPEG-TS (.ts) - Transport Stream  
- ✅ FLV (.flv) - Flash Video
- ❌ MP4 (.mp4) - "Non MPEG-TS/FLV, Unsupported media type!"

### Detecção Automática de Player
O VideoPlayer.js agora detecta automaticamente qual player usar:

```javascript
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
```

### URLs Testadas para Séries
- ❌ **Tentativa 1**: `https://server/user/pass/episode_id` (HTTP 405)
- ❌ **Tentativa 2**: `https://server/series/user/pass/episode_id.ts` (NotSupportedError)
- ❌ **Tentativa 3**: `https://server/series/user/pass/episode_id` (NotSupportedError)
- ❌ **Tentativa 4**: `https://server/user/pass/episode_id` (NotSupportedError - formato APP-bigtv-main)
- ❌ **Tentativa 5**: `https://server/user/pass/episode_id.m3u8` (NotSupportedError)
- ❌ **Tentativa 6**: `https://server/series/user/pass/episode_id.mp4` (mpegts.js: Non MPEG-TS/FLV, Unsupported media type!)
- ❌ **Tentativa 7**: `https://server/series/user/pass/episode_id.ts` (Testando novamente com .ts)
- ✅ **SOLUÇÃO FINAL**: `https://server/series/user/pass/episode_id.mp4` (com HTML5 player)

### Arquitetura Final

**TV ao Vivo** (mpegts.js):
```javascript
// Detectado por: type === 'live'
const player = mpegts.createPlayer({
  type: 'mpegts',
  isLive: true,
  url: streamUrl
});
```

**Séries e Filmes** (HTML5):
```javascript
// Detectado por: type === 'series' || type === 'movie' || url.includes('.mp4')
videoElement.src = streamUrl;
videoElement.play();
```

### URLs Corretas por Tipo
- **Canais ao vivo**: `https://server/user/pass/stream_id` (mpegts.js) ✅
- **Filmes**: `https://server/user/pass/stream_id` (HTML5) ✅  
- **Séries**: `https://server/series/user/pass/episode_id.mp4` (HTML5) ✅

### Características do Player Híbrido
1. **Detecção automática**: Escolhe o player correto baseado no tipo de conteúdo
2. **mpegts.js para streams**: TV ao vivo e streams em tempo real
3. **HTML5 para arquivos**: Séries e filmes em MP4
4. **Interface unificada**: Mesma UX independente do player usado
5. **Debug info**: Mostra qual player está sendo usado
6. **Fallback inteligente**: Se um player falhar, pode tentar o outro

### Debugging
O player agora mostra qual tipo está sendo usado:
- Loading: "Carregando... (HTML5)" ou "Carregando... (mpegts.js)"
- Error: "Player usado: HTML5" ou "Player usado: mpegts.js"
- Info: "Player: HTML5" ou "Player: mpegts.js"

## Status
✅ **CONCLUÍDO!** - Player híbrido implementado com sucesso

Solução que combina **mpegts.js** (para TV ao vivo) + **HTML5** (para séries/filmes) com detecção automática do tipo de conteúdo. Cada tipo de mídia agora usa o player mais adequado para seu formato.

### Bugs Corrigidos
- **Inicializações duplas**: Adicionada flag `initializingRef` (useRef) para prevenir conflitos
- **useEffect otimizado**: Função memoizada com `useCallback` para evitar re-renders
- **Cleanup melhorado**: Reset correto de todas as flags e estados
- **Função integrada**: `initializePlayer` movida para dentro do `useCallback` para resolver escopo

### Funcionamento Confirmado
✅ **Séries**: Detecta `type: 'series'` → usa HTML5 → reproduz MP4 com sucesso
✅ **Detecção automática**: `Tipo de player detectado: html5`
✅ **HTML5 player**: `Usando HTML5 player para MP4`
✅ **Reprodução**: `Reprodução HTML5 iniciada` 