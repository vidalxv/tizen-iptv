# Correção do Problema de Piscar no Modal de Séries

## Problema Identificado
O modal de informações das séries está piscando e recarregando a cada segundo devido a um loop infinito causado por dependências problemáticas no `useEffect`.

## Causa Raiz
No arquivo `src/components/SeriesPreview.js`, linha 250, o `useEffect` tinha `handleKeyDown` como dependência:

```javascript
useEffect(() => {
  // ... código ...
}, [isVisible, series, handleKeyDown]);
```

O problema era que `handleKeyDown` era uma função `useCallback` que dependia de muitos estados:
- focusArea
- focusedElement  
- seasonFocus
- episodeFocus
- seasons
- episodes
- isVisible
- onClose

Sempre que qualquer um desses estados mudava, `handleKeyDown` era recriada, o que disparava o `useEffect` novamente, causando o ciclo infinito.

## Solução Implementada
1. ✅ Removido `handleKeyDown` das dependências do `useEffect`
2. ✅ Movida a função `handleKeyDown` para dentro do `useEffect` para garantir que ela tenha acesso aos valores atuais dos estados
3. ✅ Convertida `loadSeriesInfo` em `useCallback` com dependência apenas no `series.series_id` para evitar re-criações desnecessárias
4. ✅ Utilizado optional chaining (`?.`) para verificar se `series` existe antes de acessar `series_id`

### Mudanças específicas:
- A função `handleKeyDown` agora é definida dentro do `useEffect` como uma função regular
- `loadSeriesInfo` foi transformada em `useCallback` com dependência estável
- As dependências do `useEffect` principal foram reduzidas para `[isVisible, series, loadSeriesInfo]`

## Arquivos Modificados
- `src/components/SeriesPreview.js`

## Status
- [x] Problema identificado
- [x] Solução implementada  
- [x] Testes realizados
- [x] Documentação atualizada

## Resultado
O modal de informações das séries agora abre normalmente sem piscar ou recarregar constantemente. A navegação por teclado e funcionalidades permanecem funcionando corretamente. 