# Correção de Loop Infinito no VideoPlayer

## Data: 2025-01-22

## Problema
Os players tanto de séries quanto de TV ao vivo estavam ficando em loop infinito e não conseguiam iniciar a reprodução.

## Causa Raiz
O problema foi causado por dependências circulares no `useCallback` do `initializeIfNeeded`:

1. **Dependências problemáticas**: As variáveis `isPlaying` e `error` estavam nas dependências do `useCallback`
2. **Ciclo infinito**: Essas variáveis eram alteradas dentro da própria função, causando re-execução contínua
3. **Re-inicializações desnecessárias**: A cada mudança de estado, o player era reinicializado

## Solução Implementada

### 1. Remoção de Dependências Circulares
- Removido `isPlaying` e `error` das dependências do `useCallback`
- Mantido apenas `[isActive, streamUrl, streamInfo]` como dependências essenciais

### 2. Controle de Estado com Refs
- Usado `initializingRef.current` para verificar status sem criar dependências
- Substituído verificações baseadas em state por verificações baseadas em refs

### 3. Prevenção de Re-inicializações Desnecessárias
- Adicionado `previousStreamUrlRef` para rastrear mudanças de URL
- Só reinicializa se a URL realmente mudou ou há erro
- Cleanup automático do player anterior quando URL muda

### 4. Melhoria do useEffect Principal
- Condição mais específica: só inicializa se `isActive && streamUrl && !initializingRef.current`
- Cleanup condicional: só limpa se `!isActive`

## Código Modificado

### Antes (problemático):
```javascript
const initializeIfNeeded = useCallback(() => {
  // ... lógica
}, [isActive, streamUrl, streamInfo, isPlaying, error]); // ❌ Dependências circulares
```

### Depois (corrigido):
```javascript
const initializeIfNeeded = useCallback(() => {
  // Verificar se a URL mudou
  if (previousStreamUrlRef.current === streamUrl && !error) {
    return; // Não reinicializar
  }
  
  // Usar refs para verificações
  if (initializingRef.current) {
    return; // Já inicializando
  }
  
  // ... lógica de inicialização
}, [isActive, streamUrl, streamInfo]); // ✅ Sem dependências circulares
```

## Benefícios da Correção

1. **Eliminação do loop infinito**: Players não ficam mais em ciclo de re-inicialização
2. **Performance melhorada**: Menos re-renderizações desnecessárias
3. **Inicialização confiável**: Players iniciam corretamente na primeira tentativa
4. **Transições suaves**: Mudanças de conteúdo não causam problemas

## Status
✅ **CORREÇÃO CONCLUÍDA**

O VideoPlayer agora funciona corretamente para:
- Séries (usando HTML5 player)
- TV ao vivo (usando mpegts.js player)
- Transições entre diferentes conteúdos
- Retry de reprodução em caso de erro 