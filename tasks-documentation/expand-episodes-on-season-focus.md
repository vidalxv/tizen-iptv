# Expansão da Área de Episódios ao Focar Temporadas - SeriesDetailsPage

## Descrição da Tarefa
Modificar a lógica de expansão da área de episódios para que ela se expanda já quando o foco estiver no seletor de temporadas, não apenas quando o foco chegar aos episódios.

## Problema Identificado
- Atualmente a área de episódios só se expande quando `focusArea === 'episodes'`
- O usuário quer ver a expansão já quando navegar pelas temporadas
- Isso proporcionará melhor antecipação visual do que está sendo carregado

## Comportamento Atual
```javascript
// Classe aplicada apenas quando foco está em episódios
className={`series-episodes-area ${focusArea === 'episodes' ? 'episodes-focused' : ''}`}
```

## Solução Proposta
- Expandir a área quando foco estiver em `'seasons'` OU `'episodes'`
- Manter a mesma classe CSS (`episodes-focused`)
- Preservar toda funcionalidade existente

## Implementação
- [ ] Modificar condição de expansão no JSX
- [ ] Testar comportamento visual
- [ ] Verificar se não afeta outras funcionalidades
- [ ] Documentar mudança

## Status
- [x] Tarefa iniciada
- [ ] Modificações implementadas
- [ ] Testes realizados
- [ ] Tarefa concluída 