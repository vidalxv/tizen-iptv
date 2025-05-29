# Remoção de Cards e Elementos de UI

## Objetivo
Remover elementos de interface específicos conforme solicitado pelo usuário:
- Badge de contagem de episódios
- Botão "Mais" da sinopse  
- Indicador de navegação

## Elementos removidos
1. **episodes-count-badge** - Badge que mostra quantidade de episódios ✅
2. **synopsis-more** - Botão para expandir/recolher sinopse ✅
3. **navigation-indicator** - Indicador de navegação no topo ✅

## Status
- [x] Remover badge de episódios do JSX
- [x] Remover botão "Mais" da sinopse
- [x] Remover indicador de navegação
- [x] Remover estado synopsisExpanded não utilizado
- [x] Limpar CSS relacionado aos elementos removidos
- [x] Sinopse sempre expandida por padrão

## Alterações realizadas
- Removido o componente `navigation-indicator` e todos os seus estilos CSS
- Removido o badge `episodes-count-badge` do título da série
- Removido o botão `synopsis-more` e deixado a sinopse sempre expandida
- Removido o estado `synopsisExpanded` que não era mais necessário
- Limpeza dos estilos CSS relacionados aos elementos removidos

## Conclusão
- [x] Tarefa completa

A interface agora está mais limpa e simplificada, removendo elementos visuais desnecessários conforme solicitado pelo usuário. 