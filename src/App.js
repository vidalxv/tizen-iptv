import React, { useState } from 'react';
import './App.css';

const menuItems = [
  'Ao Vivo',
  'Filmes',
  'Séries',
  'Favoritos',
  'Continuar Assistindo',
  'Configurações',
  'Pesquisar',
];

const shelves = [
  { title: 'Canais em Destaque', items: Array(8).fill().map((_,i) => ({ id: i, title: `Canal ${i+1}`, type: 'canal' })) },
  { title: 'Filmes Recentes', items: Array(8).fill().map((_,i) => ({ id: i, title: `Filme ${i+1}`, type: 'filme' })) },
  { title: 'Séries Populares', items: Array(8).fill().map((_,i) => ({ id: i, title: `Série ${i+1}`, type: 'serie' })) },
  { title: 'Continuar Assistindo', items: Array(4).fill().map((_,i) => ({ id: i, title: `Conteúdo ${i+1}`, type: 'vod' })) },
];

function App() {
  const [menuFocus, setMenuFocus] = useState(0);
  const [shelfFocus, setShelfFocus] = useState(0);
  const [itemFocus, setItemFocus] = useState(0);
  const [onMenu, setOnMenu] = useState(false); // Foco no menu lateral

  // Registrar teclas do controle remoto Tizen
  React.useEffect(() => {
    if (window.tizen && window.tizen.tvinputdevice) {
      const keys = [
        'MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop',
        'MediaFastForward', 'MediaRewind',
        'ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue',
      ];
      keys.forEach(k => window.tizen.tvinputdevice.registerKey(k));
    }
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      const keyCode = e.keyCode;
      // Códigos Tizen: https://developer.samsung.com/tv/develop/guides/user-interaction/remote-control-key-
      if (onMenu) {
        // Navegação no menu lateral
        if (keyCode === 38) { // Cima
          setMenuFocus((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (keyCode === 40) { // Baixo
          setMenuFocus((prev) => (prev < menuItems.length - 1 ? prev + 1 : prev));
        } else if (keyCode === 39) { // Direita
          setOnMenu(false);
        } else if (keyCode === 13) { // OK
          // Aqui você pode tratar a seleção do menu
        }
      } else {
        // Navegação nas prateleiras
        if (keyCode === 38) { // Cima
          if (itemFocus === 0 && shelfFocus > 0) {
            setShelfFocus(shelfFocus - 1);
            setItemFocus(0);
          }
        } else if (keyCode === 40) { // Baixo
          if (shelfFocus < shelves.length - 1) {
            setShelfFocus(shelfFocus + 1);
            setItemFocus(0);
          }
        } else if (keyCode === 37) { // Esquerda
          if (itemFocus > 0) {
            setItemFocus(itemFocus - 1);
          } else {
            setOnMenu(true);
          }
        } else if (keyCode === 39) { // Direita
          if (itemFocus < shelves[shelfFocus].items.length - 1) setItemFocus(itemFocus + 1);
        } else if (keyCode === 13) { // OK
          // Aqui você pode tratar a seleção do item
        }
      }
      // Exemplos de botões especiais
      if (keyCode === 10009) { // Return/Back
        // Tratar retorno
      }
      if (keyCode === 403) { // Vermelho
        // Tratar ação do botão vermelho
      }
      if (keyCode === 404) { // Verde
        // Tratar ação do botão verde
      }
      if (keyCode === 405) { // Amarelo
        // Tratar ação do botão amarelo
      }
      if (keyCode === 406) { // Azul
        // Tratar ação do botão azul
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMenu, menuFocus, shelfFocus, itemFocus]);

  return (
    <div className="iptv-app">
      <nav className="iptv-menu">
        {menuItems.map((item, idx) => (
          <div key={item} className={`iptv-menu-item${onMenu && menuFocus === idx ? ' focused' : ''}`}>{item}</div>
        ))}
      </nav>
      <main className="iptv-main">
        <section className="iptv-hero">
          <div className="iptv-hero-banner">
            <h2>Filme/Série/Canal em Destaque</h2>
            <p>Sinopse curta do conteúdo em destaque. Classificação, duração, etc.</p>
            <div className="iptv-hero-actions">
              <button>Assistir</button>
              <button>Adicionar aos Favoritos</button>
              <button>Mais Informações</button>
            </div>
          </div>
        </section>
        <section className="iptv-shelves">
          {shelves.map((shelf, sIdx) => (
            <div key={shelf.title} className="iptv-shelf">
              <h3>{shelf.title}</h3>
              <div className="iptv-shelf-items">
                {shelf.items.map((item, iIdx) => (
                  <div
                    key={item.id}
                    className={`iptv-poster${!onMenu && shelfFocus === sIdx && itemFocus === iIdx ? ' focused' : ''}`}
                  >
                    <div className="iptv-poster-img" />
                    <div className="iptv-poster-title">{item.title}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default App;
