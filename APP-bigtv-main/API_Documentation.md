# Documentação da API e Funções do BIGTV

Este documento detalha como a aplicação BIGTV interage com a API, as funções responsáveis pela exibição de filmes, séries e canais, e como as informações de episódios e temporadas são manipuladas.

## 1. Visão Geral da API

A aplicação BIGTV utiliza uma API baseada em `https://rota66.bar/player_api.php` para buscar dados de filmes, séries e canais ao vivo. As requisições são feitas com credenciais fixas (`username=zBB82J&password=AMeDHq`).

### URLs da API Utilizadas:

*   **Filmes (Categorias):** `https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_vod_categories`
*   **Séries (Categorias):** `https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_series_categories`
*   **Canais Ao Vivo (Categorias):** `https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_live_categories`
*   **Lançamentos (Filmes):** `https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_vod_streams&category_id=82`
*   **Telenovelas (Séries):** `https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_series&category_id=81`
*   **Clássicos do Cinema (Filmes):** `https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_vod_streams&category_id=50`
*   **Canais Ao Vivo (por Categoria):** `https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_live_streams&category_id={categoryId}`
*   **Filmes (por Categoria):** `https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_vod_streams&category_id={categoryId}`
*   **Séries (por Categoria):** `https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_series&category_id={categoryId}`
*   **Informações de Série/Temporada/Episódio:** A API para obter detalhes de temporadas e episódios de uma série específica não está diretamente exposta nas URLs `apiUrls` do `script.js`. No entanto, as funções `buildPreMovie` e `buildPreSeries` (importadas de `buildPre.js`) são responsáveis por construir modais de pré-visualização. A lógica para buscar informações de temporadas e episódios para séries é simulada no `buildPreSeries` com dados estáticos, não fazendo chamadas adicionais à API para esses detalhes.

## 2. Funções de Exibição de Conteúdo

### `fetchAndDisplayData(url, rowClass)`

*   **Propósito:** Função genérica para buscar dados de uma URL da API e exibi-los em uma seção de "posts" (imagens clicáveis) na página inicial.
*   **Parâmetros:**
    *   `url`: A URL da API de onde os dados serão buscados.
    *   `rowClass`: A classe CSS da div que contém os posts (`.row__posts`).
*   **Funcionamento:**
    1.  Faz uma requisição `fetch` para a `url` fornecida.
    2.  Converte a resposta para JSON.
    3.  Limpa o conteúdo existente na div `.row__posts` correspondente.
    4.  Para cada `item` nos dados recebidos:
        *   Verifica se `stream_icon` ou `cover` estão disponíveis para a imagem. Se não, pula o item.
        *   Cria um elemento `<img>`.
        *   Define `src` como `item.stream_icon` ou `item.cover`.
        *   Adiciona classes CSS (`row__post`, `row_postL`).
        *   Adiciona um `event listener` de clique para chamar `playStream(item.stream_id)` (para lançamentos, telenovelas, clássicos).
        *   Adiciona a imagem à div `.row__posts`.
*   **Utilização:** Usada para popular as seções "FILMES LANÇAMENTOS", "TELENOVELA" e "CLASSICOS DO CINEMA" na página inicial (`home`).

### `showSection(sectionId)`

*   **Propósito:** Controla a visibilidade das diferentes seções da aplicação (Home, Canais Ao Vivo, Filmes, Séries, Pesquisar) e carrega o conteúdo dinâmico de cada uma.
*   **Parâmetros:**
    *   `sectionId`: O ID da seção a ser exibida (ex: `'home'`, `'channels'`, `'movies'`, `'series'`, `'search'`, `'login-screen'`).
*   **Funcionamento:**
    1.  Esconde todas as divs com a classe `container` e a `sidebar`.
    2.  Esconde a `login-screen` se estiver visível.
    3.  Exibe a seção correspondente ao `sectionId`.
    4.  Mostra a `sidebar` se a seção não for a `login-screen`.
    5.  Atualiza a classe `active` nos links do menu lateral (`#categories-menu`).
    6.  **Carrega dados específicos da seção:**
        *   `home`: Chama `fetchAndDisplayData` para lançamentos, telenovelas e clássicos.
        *   `channels`: Chama `loadLiveCategories()`.
        *   `movies`: Chama `loadVODCategories()`.
        *   `series`: Chama `loadSeriesCategories()`.
        *   `search`: Inicializa o teclado virtual.

### `loadLiveCategories()`

*   **Propósito:** Busca as categorias de canais ao vivo da API e as exibe como botões na seção "Canais Ao Vivo".
*   **Funcionamento:**
    1.  Faz uma requisição para `apiUrls.liveCategories`.
    2.  Limpa o container `.categories`.
    3.  Para cada categoria:
        *   Cria um botão (`<button>`).
        *   Define o texto do botão como `category.category_name`.
        *   Adiciona um `event listener` de clique que:
            *   Remove a classe `active` de todos os botões de categoria.
            *   Adiciona a classe `active` ao botão clicado.
            *   Chama `loadLiveChannels(category.category_id)` para carregar os canais da categoria selecionada.

### `loadLiveChannels(categoryId)`

*   **Propósito:** Busca os canais ao vivo de uma `categoryId` específica e os exibe na seção "Canais Ao Vivo".
*   **Parâmetros:**
    *   `categoryId`: O ID da categoria de canais.
*   **Funcionamento:**
    1.  Constrói a URL da API para `get_live_streams` com o `categoryId`.
    2.  Faz a requisição `fetch`.
    3.  Limpa o container `.channels-display`.
    4.  Para cada canal:
        *   Cria uma `div` para o canal.
        *   Cria uma `img` para o ícone do canal (`channel.stream_icon`).
        *   Cria um `p` para o nome do canal (`channel.name`).
        *   Adiciona um `event listener` de clique que chama `playStream(channel.stream_id, channel.name, channel.stream_icon, channel.epg_channel_id)`.

### `loadVODCategories()`

*   **Propósito:** Busca as categorias de filmes (VOD) da API e as exibe como botões na seção "Filmes".
*   **Funcionamento:** Similar a `loadLiveCategories()`, mas chama `loadVOD(category.category_id)` ao clicar em uma categoria.

### `loadVOD(categoryId)`

*   **Propósito:** Busca os filmes (VOD) de uma `categoryId` específica e os exibe na seção "Filmes".
*   **Parâmetros:**
    *   `categoryId`: O ID da categoria de filmes.
*   **Funcionamento:**
    1.  Constrói a URL da API para `get_vod_streams` com o `categoryId`.
    2.  Faz a requisição `fetch`.
    3.  Limpa o container `.vod-display`.
    4.  Para cada filme:
        *   Cria uma `div` para o filme.
        *   Cria uma `img` para o ícone/capa do filme (`movie.stream_icon` ou `movie.cover`).
        *   Adiciona um `event listener` de clique que chama `buildPreMovie(movie).show()` para exibir um modal de pré-visualização do filme.

### `loadSeriesCategories()`

*   **Propósito:** Busca as categorias de séries da API e as exibe como botões na seção "Séries".
*   **Funcionamento:** Similar a `loadLiveCategories()`, mas chama `loadSeries(category.category_id)` ao clicar em uma categoria.

### `loadSeries(categoryId)`

*   **Propósito:** Busca as séries de uma `categoryId` específica e as exibe na seção "Séries".
*   **Parâmetros:**
    *   `categoryId`: O ID da categoria de séries.
*   **Funcionamento:**
    1.  Constrói a URL da API para `get_series` com o `categoryId`.
    2.  Faz a requisição `fetch`.
    3.  Limpa o container `.series-display`.
    4.  Para cada série:
        *   Cria uma `div` para a série.
        *   Cria uma `img` para a capa da série (`serie.cover` ou `serie.stream_icon`).
        *   Adiciona um `event listener` de clique que chama `buildPreSeries(serie).show()` para exibir um modal de pré-visualização da série.

### `playStream(streamId, streamName, streamIcon, epgChannelId)`

*   **Propósito:** Redireciona o usuário para a página `player.html` com os parâmetros necessários para iniciar a reprodução de um stream (canal ao vivo ou VOD).
*   **Parâmetros:**
    *   `streamId`: O ID do stream a ser reproduzido.
    *   `streamName` (opcional): Nome do stream.
    *   `streamIcon` (opcional): Ícone/logo do stream.
    *   `epgChannelId` (opcional): ID do canal EPG (para canais ao vivo).
*   **Funcionamento:**
    1.  Cria um objeto `URLSearchParams` para construir a query string.
    2.  Adiciona `streamId` e `type='live'` (o tipo é fixo como 'live' aqui, o que pode ser um ponto de atenção para VODs).
    3.  Adiciona `name`, `logo` e `epgChannelId` se fornecidos.
    4.  Redireciona `window.location.href` para `player.html` com os parâmetros.
*   **Observação:** O código comentado mostra uma implementação anterior de um player MPEG-TS dinâmico na própria página, que foi substituída pelo redirecionamento para `player.html`.

## 3. Funções de Pré-visualização (buildPre.js)

O arquivo `buildPre.js` contém as funções `buildPreMovie` e `buildPreSeries`, que são responsáveis por criar e exibir modais de pré-visualização detalhados para filmes e séries, respectivamente.

### `buildPreMovie(movie)`

*   **Propósito:** Constrói e exibe um modal de pré-visualização para um filme específico.
*   **Parâmetros:**
    *   `movie`: Um objeto contendo os detalhes do filme (ex: `name`, `stream_icon`, `rating`, `added`).
*   **Funcionamento:**
    1.  Remove qualquer modal existente para evitar duplicação.
    2.  Cria a estrutura HTML do modal (`div.modal`, `div.modal-content`, `span.close-btn`).
    3.  Cria um `div.pre-player` que contém `div.movie-info` e `div.movie-background`.
    4.  **`movie-background`**: Define a imagem de fundo do modal usando `movie.stream_icon`.
    5.  **`movie-info`**: Popula com:
        *   `movieTitle`: O nome do filme (`movie.name`).
        *   `movieDetails`: Inclui o ano (extraído do nome ou de `movie.added`), classificação etária (baseada em `movie.rating_5based`) e avaliação (`movie.rating`).
        *   `movieSynopsis`: Uma sinopse estática ("Uma emocionante aventura...").
        *   `playButton`: Um botão "Assistir Agora" que redireciona para `player.html` ao ser clicado.
    6.  Adiciona o modal ao `document.body`.
    7.  Retorna um objeto com métodos `show()` e `hide()` para controlar a visibilidade do modal.
*   **Observação:** A sinopse do filme é um texto fixo no código, não vindo da API. O botão "Assistir Agora" não passa o `streamId` do filme para `player.html`, o que pode ser um problema para a reprodução correta.

### `buildPreSeries(series)`

*   **Propósito:** Constrói e exibe um modal de pré-visualização para uma série específica, incluindo um seletor de temporadas e uma lista de episódios simulados.
*   **Parâmetros:**
    *   `series`: Um objeto contendo os detalhes da série (ex: `name`, `releaseDate`, `genre`, `rating_5based`, `plot`, `backdrop_path`, `episode_run_time`).
*   **Funcionamento:**
    1.  Remove qualquer modal existente.
    2.  Cria a estrutura HTML do modal, similar ao `buildPreMovie`.
    3.  Cria um `div.pre-player` que contém `div.series-background` e `div.series-info`.
    4.  **`series-background`**: Define a imagem de fundo usando `series.backdrop_path[0]` ou `series.cover`.
    5.  **`series-info`**: Popula com:
        *   `seriesTitle`: O nome da série (`series.name`).
        *   `seriesDetails`: Inclui o ano de lançamento (`series.releaseDate`), gênero (`series.genre`) e classificação etária (baseada em `series.rating_5based`).
        *   `seriesSynopsis`: A sinopse da série (`series.plot`), com funcionalidade de expandir/contrair.
        *   `seasonSelector`: Um `select` (`dropdown`) para selecionar a temporada.
            *   O número de temporadas é simulado com base no `series.backdrop_path.length` (limitado a 5) ou 1 se não houver backdrops.
            *   Ao mudar a seleção, a função `loadEpisodes()` é chamada.
        *   `episodeList`: Uma `div` que exibirá os episódios da temporada selecionada.
        *   `playButton`: Um botão "Assistir Agora" que redireciona para `player.html` (sem passar o `streamId` da série ou episódio).
    6.  Adiciona o modal ao `document.body`.
    7.  Retorna um objeto com métodos `show()` e `hide()`.
    8.  **`loadEpisodes()` (função interna):**
        *   Atualiza a imagem de fundo da série com a imagem correspondente à temporada selecionada (`series.backdrop_path[season - 1]`).
        *   **Simula dados de episódios:** Atualmente, esta função gera uma lista estática de 3 episódios por temporada com títulos genéricos ("Episódio 1", "Episódio 2", etc.) e duração baseada em `series.episode_run_time` ou um valor padrão de "25min". **Não há chamada à API para buscar episódios reais.**
        *   Cada item de episódio tem um `onclick` que exibe um `alert` simulando a reprodução.
*   **Observação:** A sinopse do filme é um texto fixo no código, não vindo da API. O botão "Assistir Agora" não passa o `streamId` do filme para `player.html`, o que pode ser um problema para a reprodução correta.

### `buildPreSeries(series)`

*   **Propósito:** Constrói e exibe um modal de pré-visualização para uma série específica, incluindo um seletor de temporadas e uma lista de episódios simulados.
*   **Parâmetros:**
    *   `series`: Um objeto contendo os detalhes da série (ex: `name`, `releaseDate`, `genre`, `rating_5based`, `plot`, `backdrop_path`, `episode_run_time`).
*   **Funcionamento:**
    1.  Remove qualquer modal existente.
    2.  Cria a estrutura HTML do modal, similar ao `buildPreMovie`.
    3.  Cria um `div.pre-player` que contém `div.series-background` e `div.series-info`.
    4.  **`series-background`**: Define a imagem de fundo usando `series.backdrop_path[0]` ou `series.cover`.
    5.  **`series-info`**: Popula com:
        *   `seriesTitle`: O nome da série (`series.name`).
        *   `seriesDetails`: Inclui o ano de lançamento (`series.releaseDate`), gênero (`series.genre`) e classificação etária (baseada em `series.rating_5based`).
        *   `seriesSynopsis`: A sinopse da série (`series.plot`), com funcionalidade de expandir/contrair.
        *   `seasonSelector`: Um `select` (`dropdown`) para selecionar a temporada.
            *   O número de temporadas é simulado com base no `series.backdrop_path.length` (limitado a 5) ou 1 se não houver backdrops.
            *   Ao mudar a seleção, a função `loadEpisodes()` é chamada.
        *   `episodeList`: Uma `div` que exibirá os episódios da temporada selecionada.
        *   `playButton`: Um botão "Assistir Agora" que redireciona para `player.html` (sem passar o `streamId` da série ou episódio).
    6.  Adiciona o modal ao `document.body`.
    7.  Retorna um objeto com métodos `show()` e `hide()`.
    8.  **`loadEpisodes()` (função interna):**
        *   Atualiza a imagem de fundo da série com a imagem correspondente à temporada selecionada (`series.backdrop_path[season - 1]`).
        *   **Simula dados de episódios:** Atualmente, esta função gera uma lista estática de 3 episódios por temporada com títulos genéricos ("Episódio 1", "Episódio 2", etc.) e duração baseada em `series.episode_run_time` ou um valor padrão de "25min". **Não há chamada à API para buscar episódios reais.**
        *   Cada item de episódio tem um `onclick` que exibe um `alert` simulando a reprodução.
*   **Observação:** A lógica de temporadas e episódios é simulada com dados estáticos. A aplicação **não busca dinamicamente** a lista de episódios ou temporadas da API. O botão "Assistir Agora" e os cliques nos episódios não passam o `streamId` correto para `player.html`, o que impediria a reprodução específica do conteúdo.

### Implementação do Mockup de Temporadas e Episódios em Séries

A função `buildPreSeries` em `buildPre.js` implementa um comportamento de mockup para a exibição de temporadas e episódios, em vez de buscar esses dados dinamicamente da API. Isso resulta na exibição de um número fixo de episódios e um limite de temporadas, independentemente dos dados reais da série na API.

*   **Limitação de Temporadas:** O seletor de temporadas é preenchido com um número de opções que é o mínimo entre a quantidade de `backdrop_path`s disponíveis para a série (usados para simular diferentes backgrounds por temporada) e o valor fixo de `5`. Se não houver `backdrop_path`s, apenas 1 temporada é exibida. Isso é definido pela linha:
    ```javascript
    const seasonCount = Math.min(series.backdrop_path ? series.backdrop_path.length : 1, 5);
    ```
    Portanto, mesmo que uma série tenha mais de 5 temporadas na API, o modal de pré-visualização só permitirá a seleção de até 5.

*   **Episódios Estáticos:** A função interna `loadEpisodes()` sempre gera uma lista de **3 episódios** para a temporada selecionada. Isso é feito através da criação de um array com 3 elementos fixos, independentemente de quantos episódios a série ou temporada realmente possua. A duração dos episódios é baseada em `series.episode_run_time` ou um valor padrão de "25min". A linha responsável por isso é:
    ```javascript
    const seasonEpisodes = new Array(3).fill().map((_, index) => ({
        title: `Episódio ${index + 1}`,
        duration: episodeDuration
    }));
    ```
    Não há chamadas à API para buscar a lista real de episódios para cada temporada. O clique em um episódio exibe apenas um `alert` simulado, não iniciando a reprodução real do episódio.

Essa abordagem de mockup foi provavelmente utilizada para fins de desenvolvimento ou demonstração, onde a integração completa com a API para detalhes de temporadas e episódios ainda não foi implementada. Para ter dados reais, seria necessário estender a lógica para fazer requisições à API (ex: `action=get_series_info&series_id={seriesId}&season_num={seasonNum}`) e popular dinamicamente o seletor de temporadas e a lista de episódios com base nas respostas da API.

## 4. Outras Funções Relevantes

*   **Login:** A tela de login (`login-screen`) é exibida inicialmente. O botão "Continuar" (`continueButton`) simplesmente chama `showSection('home')`, sem qualquer validação de credenciais no `script.js`.
*   **Navegação por Teclado:** O `script.js` implementa um sistema de foco (`updateFocus`) e navegação por teclas de seta (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`) e `Enter` para simular a interação com um controle remoto. Isso permite navegar entre elementos focáveis como botões de categoria, canais, filmes, séries e itens de menu.
*   **Pesquisa:** A seção de pesquisa (`search`) inclui um teclado virtual. As funções `typeCharacter` e `backspace` manipulam o valor do `searchInput`. A lógica de busca real (fazer a requisição à API com o termo de pesquisa) não está implementada no `script.js` fornecido.
