# Tarefa: Replicar Estilo dos Cards de Categoria

**Objetivo:** Copiar o estilo do card de categoria da página de séries para todas as outras páginas do sistema onde um card similar é utilizado.

**Status:** Parcialmente Concluída (Estilos replicados para Movies e Channels)

**Passos:**
- [x] Identificar o componente ou CSS responsável pelo estilo do card de categoria de referência (`Series.css`, `.series-category-button`).
- [x] Localizar todas as instâncias de cards de categoria similares no sistema (identificadas em `Movies.js`, `Channels.js`).
- [x] Aplicar o estilo de referência a todas as instâncias identificadas:
    - [x] Renomear classes em `Series.css` para nomes genéricos (`.category-sidebar`, `.category-list`, `.category-button`, `.main-content-area`).
    - [x] Atualizar `Series.js` para usar as novas classes.
    - [x] Remover estilos conflitantes de `Movies.css` e atualizar `Movies.js` para usar as classes genéricas.
    - [x] Remover estilos conflitantes de `Channels.css` e atualizar `Channels.js` para usar as classes genéricas.
- [ ] Unificar classes de layout principal (ex: `.series-page`, `.movies-layout`) (Opcional, mas recomendado).
- [ ] Testar as alterações para garantir consistência visual e funcional em todas as seções (Séries, Filmes, Canais).
- [ ] Identificar e atualizar outras páginas/componentes que utilizem cards de categoria, se houver.
- [ ] Marcar a tarefa como concluída.

---

# Tarefa: Implementar Paginação em Filmes e Canais

**Objetivo:** Replicar a funcionalidade de paginação existente em `Series.js` para as telas `Movies.js` e `Channels.js`.

**Status:** Em Progresso

**Passos:**
- [x] Adaptar `Movies.js`:
    - [x] Adicionar estados de paginação (`currentPage`, `ITEMS_PER_PAGE`, `GRID_COLUMNS`, `GRID_ROWS`).
    - [x] Calcular total de páginas e itens da página atual.
    - [x] Atualizar renderização para exibir informações de paginação e itens paginados.
    - [x] Adaptar navegação (`handleMoviesNavigationInternal`) para incluir mudança de página.
    - [x] Resetar `currentPage` ao mudar de categoria.
- [x] Adaptar `Channels.js`:
    - [x] Adicionar estados de paginação (`currentPage`, `ITEMS_PER_PAGE`, `GRID_COLUMNS`, `GRID_ROWS`).
    - [x] Calcular total de páginas e itens da página atual.
    - [x] Atualizar renderização para exibir informações de paginação e itens paginados.
    - [x] Adaptar navegação (`handleChannelsNavigationInternal`) para incluir mudança de página.
    - [x] Resetar `currentPage` ao mudar de categoria.
- [ ] **Revisar e ajustar `ITEMS_PER_PAGE`, `GRID_COLUMNS`, `GRID_ROWS` em `Movies.js` e `Channels.js` para corresponder ao layout CSS.**
- [ ] **Adicionar/Ajustar estilos para `.pagination-info`, `.movies-count`, `.channels-count` se necessário.**
- [ ] Testar exaustivamente a funcionalidade de paginação e navegação em Filmes e Canais.
- [ ] Marcar a tarefa como concluída. 