# Implementação de mpegts.js para Filmes MP4

## Problema Identificado

O usuário relatou que após fazer build para TV:
- ❌ **Player HTML5 padrão não funcionou** com filmes MP4
- ✅ **Canais ao vivo com mpegts.js funcionaram** perfeitamente
- 📚 **Documentação mpegts.js** confirma suporte a MP4

## Solução: Configurar mpegts.js para MP4

### 1. Configuração MediaDataSource para MP4

Segundo a documentação mpegts.js:

```javascript
// Para arquivos MP4
const mediaDataSource = {
  type: 'mp4',           // Tipo específico para MP4
  isLive: false,         // Filmes não são ao vivo
  cors: true,            // Habilitar CORS
  withCredentials: false, // Sem credenciais para evitar bloqueios
  hasAudio: true,        // MP4 tem áudio
  hasVideo: true,        // MP4 tem vídeo
  url: streamUrl         // URL do filme
};
```

### 2. Detecção de Tipo Atualizada

```javascript
const detectPlayerType = (url, info) => {
  // TV ao vivo sempre usa mpegts
  if (info?.type === 'live') {
    return 'mpegts-live';
  }
  
  // Filmes e séries MP4 usam mpegts configurado para MP4
  if (info?.type === 'movie' || info?.type === 'series') {
    return 'mpegts-vod';
  }
  
  // Fallback baseado na URL
  if (url.includes('.mp4')) {
    return 'mpegts-vod';
  }
  
  return 'mpegts-live'; // Padrão
};
```

### 3. Implementação dos Players

#### Player para Conteúdo ao Vivo:
```javascript
const initMpegtsLivePlayer = async (url, videoElement) => {
  const player = mpegts.createPlayer({
    type: 'mpegts',
    isLive: true,
    url: url
  });
  
  player.attachMediaElement(videoElement);
  player.load();
  return player;
};
```

#### Player para Filmes/Séries MP4:
```javascript
const initMpegtsVodPlayer = async (url, videoElement) => {
  const player = mpegts.createPlayer({
    type: 'mp4',           // Tipo específico para MP4
    isLive: false,         // VOD não é ao vivo
    cors: true,            // Habilitar CORS
    withCredentials: false, // Evitar problemas de autenticação
    hasAudio: true,
    hasVideo: true,
    url: url
  });
  
  player.attachMediaElement(videoElement);
  player.load();
  return player;
};
```

## Tarefas a Implementar

### ✅ Análise Completa
- [x] Identificar que HTML5 não funciona na TV
- [x] Confirmar que mpegts.js funciona com canais ao vivo
- [x] Estudar documentação mpegts.js para MP4
- [x] Definir estratégia de implementação

### 🔄 Implementação
- [x] **✅ CONCLUÍDO** - Atualizar função `detectPlayerType` no VideoPlayer.js
- [x] **✅ CONCLUÍDO** - Criar função `initMpegtsVodPlayer` para MP4
- [x] **✅ CONCLUÍDO** - Atualizar lógica de inicialização do player
- [x] **✅ CONCLUÍDO** - Remover tentativas de HTML5 para filmes na TV
- [x] **✅ CONCLUÍDO** - Corrigir URL dos filmes para estrutura simples
- [ ] Testar com filmes MP4 na TV
- [ ] Documentar resultados

### 📋 Benefícios Esperados
- **Consistência**: Usar a mesma biblioteca (mpegts.js) para todo conteúdo
- **Compatibilidade**: Melhor suporte para Tizen TV
- **Simplicidade**: Menos complexity no código de detecção
- **Confiabilidade**: Baseado na biblioteca que já funciona

## Configurações Específicas por Tipo

### Canais ao Vivo:
```javascript
{
  type: 'mpegts',
  isLive: true,
  url: streamUrl
}
```

### Filmes/Séries MP4:
```javascript
{
  type: 'mp4',
  isLive: false,
  cors: true,
  withCredentials: false,
  hasAudio: true,
  hasVideo: true,
  url: streamUrl
}
```

## URLs Mantidas

As URLs permanecem as mesmas estabelecidas anteriormente:
- **Canais**: `https://rota66.bar/zBB82J/AMeDHq/stream_id`
- **Filmes**: `https://rota66.bar/user/pass/stream_id`
- **Séries**: `https://rota66.bar/series/zBB82J/AMeDHq/episode_id.mp4`

## Logs Esperados

### Sucesso com Filmes:
```
🎬 Inicializando reprodução: https://rota66.bar/zBB82J/AMeDHq/123456
🎯 Tipo de player detectado: mpegts-vod
📽️ Configurando mpegts para MP4: type=mp4, isLive=false
✅ mpegts MP4 player carregado com sucesso
```

### Sucesso com Canais:
```
🎬 Inicializando reprodução: https://rota66.bar/zBB82J/AMeDHq/147482
🎯 Tipo de player detectado: mpegts-live
📡 Configurando mpegts para live: type=mpegts, isLive=true
✅ mpegts live player carregado com sucesso
```

## ✅ Correções Implementadas

### 1. **URLs Corrigidas**
- ❌ **Antes**: `https://rota66.bar/movies/user/pass/stream_id.mp4`
- ✅ **Depois**: `https://rota66.bar/user/pass/stream_id`

### 2. **Detecção de Player Atualizada**
```javascript
// Filmes e séries agora usam mpegts-vod na TV
if (info?.type === 'movie' || info?.type === 'series') {
  return 'mpegts-vod';
}
```

### 3. **Player mpegts para MP4**
```javascript
// Configuração específica para arquivos MP4 via mpegts.js
const player = mpegts.createPlayer({
  type: 'mp4',           // Tipo específico para MP4
  isLive: false,         // VOD não é ao vivo
  cors: true,            // Habilitar CORS
  withCredentials: false, // Evitar problemas de autenticação
  hasAudio: true,        // MP4 tem áudio
  hasVideo: true,        // MP4 tem vídeo
  url: url
});
``` 