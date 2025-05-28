import { buildPreMovie, buildPreSeries } from "./buildPre.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const continueButton = document.getElementById('continueButton');
    const sidebar = document.getElementById('sidebar');

    const links = document.querySelectorAll('#categories-menu li a');
    const containers = document.querySelectorAll('.container');
    const navLinks = document.querySelectorAll('#nav li');
    let activeIndex = 0;


    // URLs da API
    const apiUrls = {
        filmes: "https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_vod_categories",
        series: "https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_series_categories",
        liveCategories: "https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_live_categories",
        lancamentos: "https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_vod_streams&category_id=82",
        telenovela: "https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_series&category_id=81",
        classicos: "https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_vod_streams&category_id=50",
    };


    // Função para buscar e exibir dados de uma API
    async function fetchAndDisplayData(url, rowClass) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            const row = document.querySelector(`.${rowClass} .row__posts`);

            // Limpa o conteúdo atual da row
            row.innerHTML = "";

            // Adiciona os novos itens
            data.forEach((item) => {
                if (!item.stream_icon && !item.cover) {
                    return; // Pula o item se nenhuma das imagens estiver disponível
                }
                const img = document.createElement("img");
                img.src = item.stream_icon || item.cover; // Usa a imagem do item
                img.alt = item.name;
                img.classList.add("row__post", "row_postL");

                // Adiciona evento de clique para reproduzir o stream
                img.addEventListener('click', () => {
                    playStream(item.stream_id); // Passa o stream_id
                });

                row.appendChild(img);
            });
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        }
    }
    // Função para exibir uma seção e atualizar o estado ativo
    function showSection(sectionId) {
        // Esconde todas as seções
        containers.forEach(container => container.style.display = 'none');
        sidebar.style.display = 'none'; // Hide sidebar by default

        // Esconde a tela de login
        if (loginScreen) {
            loginScreen.style.display = 'none';
        }

        // Exibe a seção correspondente
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
        }

        // Mostra a sidebar se não for a tela de login
        if (sectionId !== 'login-screen') {
            sidebar.style.display = 'block';
        }

        // Atualiza o estado ativo no menu lateral
        links.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`#categories-menu a[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Carrega dados específicos da seção
        if (sectionId === 'home') {
            fetchAndDisplayData(apiUrls.lancamentos, "row__lancamentos");
            fetchAndDisplayData(apiUrls.telenovela, "row__telenovela");
            fetchAndDisplayData(apiUrls.classicos, "row__classicos");
        } else if (sectionId === 'channels') {
            loadLiveCategories(); // Carrega as categorias de canais ao vivo
        } else if (sectionId === 'movies') {
            loadVODCategories(); // Carrega as categorias de filmes
        } else if (sectionId === 'series') {
            loadSeriesCategories(); // Carrega as categorias de séries
        } else if (sectionId === 'search') {
            // Initialize the keyboard when the search section is shown
            renderKeyboard(currentKeyboardMode);
        }
    }

    // Adiciona eventos de clique nos links do menu lateral
    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // Adiciona eventos de clique no menu superior
    navLinks.forEach(nav => {
        nav.addEventListener('click', () => {
            const sectionId = nav.getAttribute('data-section');
            if (sectionId) { // Verifica se o item possui data-section
                showSection(sectionId);
            }
        });
    });

    // Função para buscar e exibir dados de uma API
    async function fetchAndDisplayData(url, rowClass) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            const row = document.querySelector(`.${rowClass} .row__posts`);

            // Limpa o conteúdo atual da row
            row.innerHTML = "";

            // Adiciona os novos itens
            data.forEach((item) => {
                if (!item.stream_icon && !item.cover) {
                    return; // Pula o item se nenhuma das imagens estiver disponível
                }
                const img = document.createElement("img");
                img.src = item.stream_icon || item.cover; // Usa a imagem do item
                img.alt = item.name;
                img.classList.add("row__post", "row_postL");
                row.appendChild(img);
            });
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        }
    }

    // Função para carregar e exibir as categorias de canais ao vivo
    async function loadLiveCategories() {
        const categoriesContainer = document.querySelector('.categories');
        if (!categoriesContainer) return;

        try {
            const response = await fetch(apiUrls.liveCategories);
            const categories = await response.json();

            categoriesContainer.innerHTML = "";

            categories.forEach(category => {
                const categoryButton = document.createElement('button');
                categoryButton.textContent = category.category_name;
                categoryButton.classList.add('category-button');
                categoryButton.addEventListener('click', () => {
                    // Remove a classe 'active' de todos os botões
                    document.querySelectorAll('.categories .category-button').forEach(button => {
                        button.classList.remove('active');
                    });
                    // Adiciona a classe 'active' ao botão clicado
                    categoryButton.classList.add('active');
                    loadLiveChannels(category.category_id);
                });
                categoriesContainer.appendChild(categoryButton);
            });
        } catch (error) {
            console.error("Erro ao carregar as categorias de canais ao vivo:", error);
        }
    }

    // Função para carregar e exibir as categorias de filmes// Função para carregar e exibir as categorias de filmes
    async function loadVODCategories() {
        const categoriesContainer = document.querySelector('.vod-categories');
        if (!categoriesContainer) return;

        try {
            const response = await fetch(apiUrls.filmes);
            const categories = await response.json();

            categoriesContainer.innerHTML = "";

            categories.forEach(category => {
                const categoryButton = document.createElement('button');
                categoryButton.textContent = category.category_name;
                categoryButton.classList.add('category-button');
                categoryButton.addEventListener('click', () => {
                    // Remove a classe 'active' de todos os botões
                    document.querySelectorAll('.vod-categories .category-button').forEach(button => {
                        button.classList.remove('active');
                    });
                    // Adiciona a classe 'active' ao botão clicado
                    categoryButton.classList.add('active');
                    loadVOD(category.category_id);
                });
                categoriesContainer.appendChild(categoryButton);
            });
        } catch (error) {
            console.error("Erro ao carregar as categorias de filmes:", error);
        }
    }

    // Função para carregar e exibir as categorias de séries// Função para carregar e exibir as categorias de séries
    async function loadSeriesCategories() {
        const categoriesContainer = document.querySelector('.series-categories');
        if (!categoriesContainer) return;

        try {
            const response = await fetch(apiUrls.series);
            const categories = await response.json();

            categoriesContainer.innerHTML = "";

            categories.forEach(category => {
                const categoryButton = document.createElement('button');
                categoryButton.textContent = category.category_name;
                categoryButton.classList.add('category-button');
                categoryButton.addEventListener('click', () => {
                    // Remove a classe 'active' de todos os botões
                    document.querySelectorAll('.series-categories .category-button').forEach(button => {
                        button.classList.remove('active');
                    });
                    // Adiciona a classe 'active' ao botão clicado
                    categoryButton.classList.add('active');
                    loadSeries(category.category_id);
                });
                categoriesContainer.appendChild(categoryButton);
            });
        } catch (error) {
            console.error("Erro ao carregar as categorias de séries:", error);
        }
    }

    // Função para carregar e exibir os canais de uma categoria específica
    async function loadLiveChannels(categoryId) {
        const channelsDisplay = document.querySelector('.channels-display');
        if (!channelsDisplay) return;

        try {
            const channelsUrl = `https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_live_streams&category_id=${categoryId}`;
            const response = await fetch(channelsUrl);
            const channels = await response.json();

            channelsDisplay.innerHTML = "";

            channels.forEach(channel => {
                const channelDiv = document.createElement('div');
                channelDiv.classList.add('channel');

                const channelImage = document.createElement('img');
                channelImage.src = channel.stream_icon;
                channelImage.alt = channel.name;

                const channelNameP = document.createElement('p'); // Renomeado para evitar conflito
                channelNameP.textContent = channel.name;

                channelDiv.appendChild(channelImage);
                channelDiv.appendChild(channelNameP);
                channelsDisplay.appendChild(channelDiv);

                // Adiciona evento de clique para reproduzir o stream
                channelDiv.addEventListener('click', () => {
                    playStream(channel.stream_id, channel.name, channel.stream_icon, channel.epg_channel_id); 
                });
            });
        } catch (error) {
            console.error("Erro ao carregar os canais ao vivo:", error);
        }
    }

    // Função para carregar e exibir os filmes de uma categoria específica
    async function loadVOD(categoryId) {
        const vodDisplay = document.querySelector('.vod-display');
        if (!vodDisplay) return;

        try {
            const vodUrl = `https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_vod_streams&category_id=${categoryId}`;
            const response = await fetch(vodUrl);
            const vod = await response.json();

            vodDisplay.innerHTML = "";

            vod.forEach(movie => {
                const movieDiv = document.createElement('div');
                movieDiv.classList.add('movie');

                const movieImage = document.createElement('img');
                movieImage.src = movie.stream_icon || movie.cover;
                movieImage.alt = movie.name;

                movieDiv.appendChild(movieImage);
                vodDisplay.appendChild(movieDiv);

                // Adiciona evento de clique para mostrar o modal
                movieDiv.addEventListener('click', () => {
                    const modal = buildPreMovie(movie);
                    modal.show(); // Agora chamamos o método show() para exibir o modal
                });
            });
        } catch (error) {
            console.error("Erro ao carregar os filmes:", error);
        }
    }

    // Função para carregar e exibir as séries de uma categoria específica
    async function loadSeries(categoryId) {
        const seriesDisplay = document.querySelector('.series-display');
        if (!seriesDisplay) return;

        try {
            const seriesUrl = `https://rota66.bar/player_api.php?username=zBB82J&password=AMeDHq&action=get_series&category_id=${categoryId}`;
            const response = await fetch(seriesUrl);
            const series = await response.json();

            seriesDisplay.innerHTML = "";

            series.forEach(serie => {
                const serieDiv = document.createElement('div');
                serieDiv.classList.add('serie');

                const serieImage = document.createElement('img');
                serieImage.src = serie.cover || serie.stream_icon;
                serieImage.alt = serie.name;

                serieDiv.appendChild(serieImage);
                seriesDisplay.appendChild(serieDiv);

                // Adiciona evento de clique para reproduzir a série
                serieDiv.addEventListener('click', () => {
                    const modal = buildPreSeries(serie);
                    modal.show();
                });
            });
        } catch (error) {
            console.error("Erro ao carregar as séries:", error);
        }
    }

    // Função para iniciar o player
    function playStream(streamId, streamName, streamIcon, epgChannelId) {
        // const streamUrl = `https://rota66.bar/zBB82J/AMeDHq/${streamId}`; // URL base do stream

        // Redireciona para player.html com os dados
        const params = new URLSearchParams();
        params.append('streamId', streamId);
        params.append('type', 'live');
        if (streamName) params.append('name', streamName);
        if (streamIcon) params.append('logo', streamIcon);
        if (epgChannelId) params.append('epgChannelId', epgChannelId);

        window.location.href = `player.html?${params.toString()}`;

        /* Código comentado - player dinâmico anterior
        if (mpegts.isSupported()) {
            const videoElement = document.createElement('video');
            videoElement.controls = true;
            videoElement.autoplay = true;

            const existingPlayer = document.getElementById('video-player');
            if (existingPlayer) {
                existingPlayer.remove();
            }

            videoElement.id = 'video-player';
            videoElement.style.position = 'fixed';
            videoElement.style.top = '0px';
            videoElement.style.left = '0px'
            videoElement.style.zIndex = '999';
            videoElement.style.width = '100%';
            videoElement.style.height = 'auto';
            document.body.appendChild(videoElement);

            const player = mpegts.createPlayer({
                type: 'mpegts',
                isLive: true,
                url: streamUrl,
            });

            player.attachMediaElement(videoElement);
            player.load();
            player.play();

            const closeButton = document.createElement('button');
            closeButton.textContent = 'Fechar Player';
            closeButton.style.position = 'fixed';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.zIndex = '1000';
            closeButton.addEventListener('click', () => {
                player.destroy();
                videoElement.remove();
                closeButton.remove();
            });
            document.body.appendChild(closeButton);
        } else {
            alert('Seu navegador não suporta a reprodução de streams MPEG-TS.');
        }
        */
    }

    let currentFocus = null;

    // Função para atualizar o foco visual
    function updateFocus() {
        // Remove o foco de todos os elementos focáveis anteriores
        document.querySelectorAll('.focusable').forEach(el => el.classList.remove('focused'));

        // Encontra todos os elementos focáveis na seção visível
        const visibleSection = document.querySelector('.container[style*="display: block"]') || document.getElementById('login-screen');
        if (!visibleSection) return;

        let focusableElements;
        if (visibleSection.id === 'login-screen') {
            focusableElements = visibleSection.querySelectorAll('#loginEmail, #loginPassword, #continueButton');
        } else {
            focusableElements = visibleSection.querySelectorAll('.category-button, .channel, .movie, .serie, #categories-menu li a, #nav li, #searchInput, .key');
        }

        if (focusableElements.length === 0) {
            currentFocus = null;
            return;
        }

        // Se não houver foco atual ou o foco atual não estiver na lista, foca no primeiro
        if (!currentFocus || !Array.from(focusableElements).includes(currentFocus)) {
            currentFocus = focusableElements[0];
        }

        // Adiciona a classe 'focused' ao elemento atual
        currentFocus.classList.add('focused');

        // Opcional: rolar para o elemento focado se estiver fora da tela
        currentFocus.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Listener para eventos de tecla do controle remoto
    document.addEventListener('keydown', (event) => {
        const key = event.key; // Use event.key para compatibilidade moderna

        const visibleSection = document.querySelector('.container[style*="display: block"]');
        if (!visibleSection) return;

        const focusableElements = Array.from(visibleSection.querySelectorAll('.category-button, .channel, .movie, .serie, #categories-menu li a, #nav li'));

        if (focusableElements.length === 0) return;

        let currentIndex = focusableElements.indexOf(currentFocus);
        if (currentIndex === -1) {
             currentIndex = 0; // Começa do primeiro se o foco atual não for encontrado
             currentFocus = focusableElements[currentIndex];
             updateFocus();
             return;
        }


        switch (key) {
            case 'ArrowUp':
                event.preventDefault(); // Previne a rolagem padrão da página
                // Lógica para mover o foco para cima (pode ser complexo dependendo do layout)
                // Por enquanto, uma navegação linear simples:
                currentIndex = Math.max(0, currentIndex - 1);
                currentFocus = focusableElements[currentIndex];
                updateFocus();
                break;
            case 'ArrowDown':
                event.preventDefault(); // Previne a rolagem padrão da página
                // Lógica para mover o foco para baixo
                currentIndex = Math.min(focusableElements.length - 1, currentIndex + 1);
                currentFocus = focusableElements[currentIndex];
                updateFocus();
                break;
            case 'ArrowLeft':
                 event.preventDefault(); // Previne a rolagem padrão da página
                 // Lógica para mover o foco para a esquerda (pode ser complexo)
                 // Implementação simples: move para o item anterior
                 currentIndex = Math.max(0, currentIndex - 1);
                 currentFocus = focusableElements[currentIndex];
                 updateFocus();
                 break;
            case 'ArrowRight':
                 event.preventDefault(); // Previne a rolagem padrão da página
                 // Lógica para mover o foco para a direita (pode ser complexo)
                 // Implementação simples: move para o próximo item
                 currentIndex = Math.min(focusableElements.length - 1, currentIndex + 1);
                 currentFocus = focusableElements[currentIndex];
                 updateFocus();
                 break;
            case 'Enter':
                event.preventDefault(); // Previne a ação padrão do Enter
                // Simula um clique no elemento focado
                if (currentFocus) {
                    currentFocus.click();
                }
                break;
            // Adicione outros casos para outras teclas do controle remoto, se necessário
            // Ex: 'Backspace' para voltar, 'MediaPlay' para play, etc.
        }
    });

    // Initial setup: show login screen and hide other sections
    if (loginScreen) {
        loginScreen.style.display = 'flex'; // Show login screen
    }
    containers.forEach(container => container.style.display = 'none'); // Hide all content containers
    sidebar.style.display = 'none'; // Hide sidebar

    // Add event listener for the continue button
    if (continueButton) {
        continueButton.addEventListener('click', () => {
            // For now, just transition to home
            showSection('home');
        });
    }

    // Inicializa o foco após carregar a página e exibir a seção inicial
    updateFocus();


    const searchInput = document.getElementById('searchInput');

    function typeCharacter(char) {
        if (searchInput) searchInput.value += char;
    }

    function backspace() {
        if (searchInput) searchInput.value = searchInput.value.slice(0, -1);
    }


    // Add event listeners to the static keyboard keys in index.html
        document.querySelectorAll('.keyboard-layout .key').forEach(key => {
        if (key.classList.contains('backspace-key')) {
            key.addEventListener('click', backspace);
        } else if (key.classList.contains('clear-all-key')) {
            key.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
            });
        } else if (key.classList.contains('delete-key')) {
            key.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
            });
        }
        else if (key.classList.contains('space-key')) {
            // Para espaço, insere um único espaço fixo
            key.addEventListener('click', () => {
                typeCharacter(' ');
            });
        }
        else {
            key.addEventListener('click', (event) => {
                // Usa currentTarget para pegar o texto do botão, não do filho
                typeCharacter(event.currentTarget.textContent.trim());
            });
        }
    });

});
