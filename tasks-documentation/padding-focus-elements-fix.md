# Correção de Padding para Elementos Focados

## Problema Identificado
Após a implementação do carrossel, os cards de temporadas e episódios voltaram a ser "engolidos" pelas bordas quando expandem com `transform: scale()` ao receber foco.

## Causa Raiz
Os elementos quando focados aplicam transformações:
- **Temporadas**: `transform: scale(1.1)` (10% de aumento)
- **Episódios**: `transform: scale(1.05) translateY(-8px)` (5% de aumento + deslocamento)

O padding anterior de `20px 24px` não era suficiente para acomodar essa expansão.

## Solução Implementada
Aumentei o padding para dar mais espaço aos elementos expandidos:

### Mudanças no CSS
```css
/* ANTES */
.season-selector {
  padding: 20px 24px;
}

.episodes-grid-container {
  padding: 20px 24px;
}

.episodes-grid-new {
  gap: 16px;
  padding-bottom: 10px;
}

/* DEPOIS */
.season-selector {
  padding: 30px 40px; /* +10px vertical, +16px horizontal */
}

.episodes-grid-container {
  padding: 30px 40px; /* +10px vertical, +16px horizontal */
}

.episodes-grid-new {
  gap: 20px; /* +4px para mais espaço entre cards */
  padding: 10px 0; /* Padding vertical para expansão */
}
```

## Benefícios
- ✅ Elementos focados não são mais cortados pelas bordas
- ✅ Maior espaçamento entre cards no carrossel
- ✅ Padding adequado para acomodar transformações de escala
- ✅ Melhor experiência visual durante navegação

## Status
- ✅ **CORREÇÃO APLICADA E CONCLUÍDA** 