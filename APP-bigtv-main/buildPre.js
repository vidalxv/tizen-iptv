export function buildPreMovie(movie) {
    // Verificar se já existe um modal e removê-lo
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Criar elementos do modal
    const modal = document.createElement('div');
    modal.classList.add('modal');

    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    const closeBtn = document.createElement('span');
    closeBtn.classList.add('close-btn');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    const prePlayer = document.createElement('div');
    prePlayer.classList.add('pre-player');

    // Criar background do filme
    const movieBackground = document.createElement('div');
    movieBackground.classList.add('movie-background');
    movieBackground.style.backgroundImage = `url('${movie.stream_icon}')`;

    // Criar informações do filme
    const movieInfo = document.createElement('div');
    movieInfo.classList.add('movie-info');

    const movieTitle = document.createElement('h1');
    movieTitle.classList.add('movie-title');
    movieTitle.textContent = movie.name;

    const movieDetails = document.createElement('div');
    movieDetails.classList.add('movie-details');

    // Extrair ano do nome do filme
    const yearMatch = movie.name.match(/- (\d{4})$/);
    const year = yearMatch ? yearMatch[1] : new Date(parseInt(movie.added) * 1000).getFullYear();

    movieDetails.innerHTML = `
        <span>${year}</span>
        <span>Classificação: ${movie.rating_5based >= 3.5 ? '12 anos' : 'Livre'}</span>
        <span>Avaliação: ${movie.rating}/10</span>
    `;

    const movieSynopsis = document.createElement('p');
    movieSynopsis.classList.add('movie-synopsis');
    movieSynopsis.textContent = "Uma emocionante aventura que cativou audiências ao redor do mundo. Este filme promete entretenimento de alta qualidade para todos os tipos de espectadores.";

    const playButton = document.createElement('button');
    playButton.classList.add('play-button');
    playButton.innerHTML = '<i class="fas fa-play"></i> Assistir Agora';
    playButton.addEventListener('click', () => {
        window.location.href = 'player.html';
    });

    // Montar a estrutura
    movieInfo.appendChild(movieTitle);
    movieInfo.appendChild(movieDetails);
    movieInfo.appendChild(movieSynopsis);
    movieInfo.appendChild(playButton);

    prePlayer.appendChild(movieInfo);
    prePlayer.appendChild(movieBackground);
    

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(prePlayer);

    modal.appendChild(modalContent);

    
    // Adicionar modal ao body
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    // Retornar objeto com métodos para controlar o modal
    return {
        element: modal,
        show: function () {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        },
        hide: function () {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
}

export function buildPreSeries(series) {
    // Verificar se já existe um modal e removê-lo
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Criar elementos do modal
    const modal = document.createElement('div');
    modal.classList.add('modal');

    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    const closeBtn = document.createElement('span');
    closeBtn.classList.add('close-btn');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    const prePlayer = document.createElement('div');
    prePlayer.classList.add('pre-player');

    // Criar background da série
    const seriesBackground = document.createElement('div');
    seriesBackground.classList.add('series-background');
    
    // Usar a primeira imagem de backdrop como padrão
    if (series.backdrop_path && series.backdrop_path.length > 0) {
        seriesBackground.style.backgroundImage = `url('${series.backdrop_path[0]}')`;
    } else if (series.cover) {
        seriesBackground.style.backgroundImage = `url('${series.cover}')`;
    }

    // Criar informações da série
    const seriesInfo = document.createElement('div');
    seriesInfo.classList.add('series-info');

    const seriesTitle = document.createElement('h1');
    seriesTitle.classList.add('series-title');
    seriesTitle.textContent = series.name;

    const seriesDetails = document.createElement('div');
    seriesDetails.classList.add('series-details');

    // Processar detalhes da série
    const releaseYear = new Date(series.releaseDate).getFullYear();
    const currentYear = new Date().getFullYear();

    seriesDetails.innerHTML = `
        <span>${releaseYear} - ${currentYear}</span>
        <span>Gênero: ${series.genre || 'Não especificado'}</span>
        <span>Classificação: ${series.rating_5based >= 3.5 ? '16 anos' : 'Livre'}</span>
    `;

    const seriesSynopsis = document.createElement('p');
    seriesSynopsis.classList.add('series-synopsis');
    seriesSynopsis.textContent = series.plot || "Sem sinopse disponível.";

    // Add click event to toggle synopsis expansion
    seriesSynopsis.addEventListener('click', () => {
        seriesSynopsis.classList.toggle('expanded');
    });


    // Container para o seletor de temporada (botões)
    const seasonsContainer = document.createElement('div');
    seasonsContainer.classList.add('seasons-container');

    const seasonsList = document.createElement('div');
    seasonsList.classList.add('seasons-list');
    seasonsContainer.appendChild(seasonsList);

    // Criar um número de temporadas baseado no número de backdrops (ou um máximo de 10 para mock)
    const seasonCount = Math.min(series.backdrop_path ? series.backdrop_path.length : 1, 10);
    for (let i = 1; i <= seasonCount; i++) {
        const seasonItem = document.createElement('div');
        seasonItem.classList.add('season-item');
        seasonItem.textContent = `Temporada ${i}`;
        seasonItem.dataset.season = i; // Armazena o número da temporada
        seasonItem.addEventListener('click', () => {
            loadEpisodes(i); // Carrega os episódios da temporada clicada
            // Remove a classe 'active' de todos os itens e adiciona ao clicado
            document.querySelectorAll('.season-item').forEach(item => item.classList.remove('active'));
            seasonItem.classList.add('active');
        });
        seasonsList.appendChild(seasonItem);
    }

    // Container para a lista de episódios com scroll
    const episodeScrollContainer = document.createElement('div');
    episodeScrollContainer.classList.add('episodes-scroll-container');

    const episodeList = document.createElement('div');
    episodeList.classList.add('episode-list');
    episodeList.id = 'episode-list';
    episodeScrollContainer.appendChild(episodeList);

    // Botão de reprodução
    const playButton = document.createElement('button');
    playButton.classList.add('play-button');
    playButton.innerHTML = '<i class="fas fa-play"></i> Assistir Agora';
    playButton.addEventListener('click', () => {
        window.location.href = 'player.html';
    });

    // Montar a estrutura
    seriesInfo.appendChild(seriesTitle);
    seriesInfo.appendChild(seriesDetails);
    seriesInfo.appendChild(seriesSynopsis);
    seriesInfo.appendChild(seasonsContainer); // Adiciona o container de temporadas
    seriesInfo.appendChild(episodeScrollContainer); // Adiciona o container de scroll
    seriesInfo.appendChild(playButton);

    prePlayer.appendChild(seriesBackground);
    prePlayer.appendChild(seriesInfo);

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(prePlayer);

    modal.appendChild(modalContent);

    // Adicionar modal ao body
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Função para carregar episódios e atualizar background
    function loadEpisodes(seasonNumber = 1) { // Adiciona seasonNumber como parâmetro com valor padrão
        const episodeListContainer = document.getElementById('episode-list');
        episodeListContainer.innerHTML = ''; // Limpa o conteúdo atual

        // Atualizar background da série com a imagem da temporada selecionada
        if (series.backdrop_path && series.backdrop_path[seasonNumber - 1]) {
            seriesBackground.style.backgroundImage = `url('${series.backdrop_path[seasonNumber - 1]}')`;
        }

        // Usar tempo de episódio do objeto se disponível
        const episodeDuration = series.episode_run_time ? `${series.episode_run_time}min` : "25min";

        // Gerar lista de episódios baseado no número de temporadas (ainda simulado)
        // Alterado para 20 episódios para melhor visualização do scroll horizontal
        const seasonEpisodes = new Array(24).fill().map((_, index) => ({
            title: `Episódio ${index + 1}`,
            duration: episodeDuration
        }));

        seasonEpisodes.forEach((episode, index) => {
            const episodeItem = document.createElement('div');
            episodeItem.classList.add('episode-item');
            episodeItem.innerHTML = `
                <span class="episode-number">${index + 1}</span>
                <span class="episode-title">${episode.title}</span>
                <span class="episode-duration">${episode.duration}</span>
            `;
            episodeItem.onclick = () => alert(`Reproduzindo ${episode.title}`);
            episodeListContainer.appendChild(episodeItem);
        });
    }

    // Carrega os episódios da primeira temporada ao abrir o modal e define a primeira temporada como ativa
    loadEpisodes(1);
    document.querySelector('.season-item[data-season="1"]').classList.add('active');

    // Retornar objeto com métodos para controlar o modal
    return {
        element: modal,
        show: function () {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        },
        hide: function () {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
}
