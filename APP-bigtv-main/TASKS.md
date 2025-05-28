# Lista de Tarefas

- [x] Conectar ao Figma e obter informações do design.
- [x] Analisar o design do Figma e identificar mudanças no HTML e CSS.
- [x] Implementar as mudanças no arquivo `player.html`.
- [x] Atualizar o atributo `src` da tag `<video>` com o canal fornecido (placeholder `STREAM_URL_FOR_t7n2mi64`).
- [x] Analisar a codebase para entender como os canais ao vivo exibem o player.
- [x] Modificar `script.js` para redirecionar para `player.html` com `streamId`, nome, logo e epgChannelId.
- [x] Modificar `player.html` para carregar vídeo usando `streamId` da URL, `mpegts.js`, e buscar dados dinâmicos do canal/EPG para a overlay.
- [x] Remover/ocultar controles de pausa e barra de progresso do vídeo para canais ao vivo em `player.html`.
- [x] Tentar autoplay explícito e ocultar todos os botões de play/pause para canais ao vivo.
- [x] Ocultar a barra de progresso do programa na overlay para canais ao vivo.
- [x] Reestruturar a overlay para agrupar todas as informações na base do player, conforme imagem (primeira versão - layout "Band").
- [x] Ajustar o layout da overlay (baseado na imagem da Band) para remover número do canal, horários de início do EPG e refinar estilos.
- [x] Reverter e reajustar o layout da overlay para o modelo da imagem do SBT (logo circular, número do canal, EPG em duas linhas, data/hora na mesma linha, fundo mais escuro).
- [x] Ajustar layout para o modelo "Band" (logo não circular, sem número do canal, EPG em linha única) e aumentar espaçamento entre "Atual" e "Próximo".
- [x] Corrigir o espaçamento entre "Atual" e "Próximo" removendo justify-content: space-between e usando gap.
- [x] Marcar tarefas como concluídas. 