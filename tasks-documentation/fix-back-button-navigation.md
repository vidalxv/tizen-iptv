# Correção do Botão Voltar - SeriesDetailsPage

## Descrição da Tarefa
Corrigir o comportamento do botão voltar na tela de detalhes da série para que retorne para a tela anterior ao invés de ir diretamente para a home.

## Problema Identificado
- Atualmente quando o usuário pressiona Escape/Backspace na `SeriesDetailsPage`, ele volta diretamente para a home
- O comportamento esperado é voltar para a tela anterior (onde o usuário estava antes)
- Isso quebra o fluxo de navegação natural do usuário

## Comportamento Atual
```javascript
case 'Escape':
case 'Backspace':
  event.preventDefault();
  onBack(); // Vai direto para home
  break;
```

## Análise da Solução
- A função `onBack()` está sendo chamada quando deveria haver navegação para tela anterior
- Preciso investigar como o componente é chamado e implementar navegação correta
- Pode ser necessário usar histórico de navegação ou props específicas

## Implementação
- [ ] Investigar como SeriesDetailsPage é chamado
- [ ] Verificar se há navegação de histórico disponível
- [ ] Implementar volta para tela anterior
- [ ] Testar navegação correta

## Status
- [x] Problema identificado
- [ ] Investigação realizada
- [ ] Solução implementada
- [ ] Testes realizados
- [ ] Tarefa concluída 