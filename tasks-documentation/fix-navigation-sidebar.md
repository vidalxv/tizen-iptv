# Correção: Navegação Incorreta da Sidebar

## Problema Identificado
O botão "voltar" (seta para a esquerda) está indo diretamente para a sidebar ao invés de navegar dentro do sistema. Especificamente:

- Em componentes como Series, Movies e Channels, a navegação interna não está funcionando corretamente
- A tecla "Esquerda" (keyCode 37) sempre aciona `setOnMenu(true)` no App.js
- Não há verificação se o componente interno deve processar a navegação primeiro

## Análise do Problema
No arquivo `src/App.js`, nas linhas 118, 125, 137 e 147, a lógica está:
```javascript
if (keyCode === 37) { // Esquerda - voltar ao menu
  setOnMenu(true);
}
```

Isso impede que os componentes internos (Series.js, Movies.js, Channels.js) processem a navegação à esquerda, que deveria:
1. Navegar entre categorias e conteúdo
2. Só ir para sidebar quando estiver na primeira posição

## Solução Implementada
Modificar a lógica no `App.js` para:
1. **Sempre delegar** a navegação à esquerda para os componentes internos
2. Os componentes internos decidem quando voltar para a sidebar
3. Usar um evento customizado `backToSidebar` para solicitar volta à sidebar quando necessário

## Arquivos Modificados
- `src/App.js` - Correção da lógica de navegação
- `src/components/Series.js` - Emisão de evento para voltar à sidebar
- `src/components/Movies.js` - Emisão de evento para voltar à sidebar  
- `src/components/Channels.js` - Emisão de evento para voltar à sidebar

## Status
- [x] Análise do problema ✅
- [x] Implementação da solução ✅
- [x] Modificação do App.js ✅
- [x] Modificação dos componentes internos ✅
- [x] Teste da navegação ✅
- [x] Documentação atualizada ✅ 