import React from 'react';
import './Sidebar.css';

const menuItems = [
  { id: 'search', label: 'Pesquisar', icon: 'fa-magnifying-glass' },
  { id: 'home', label: 'Home', icon: 'fa-house' },
  { id: 'channels', label: 'Canais Ao Vivo', icon: 'fa-tv' },
  { id: 'movies', label: 'Filmes', icon: 'fa-film' },
  { id: 'series', label: 'Séries', icon: 'fa-video' },
];

const Sidebar = ({ currentSection, onMenu, menuFocus, onSectionChange }) => {
  const handleItemClick = (sectionId) => {
    onSectionChange(sectionId);
  };

  return (
    <nav className={`sidebar ${onMenu ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-logo">
        <img 
          src="/images/BIGTV-transparente.png" 
          alt="BIGTV Logo" 
          className="sidebar-logo-img"
        />
      </div>
      
      <div className="sidebar-menu">
        {menuItems.map((item, idx) => (
          <div 
            key={item.id} 
            className={`sidebar-menu-item ${
              currentSection === item.id ? 'active' : ''
            } ${
              onMenu && menuFocus === idx ? 'focused' : ''
            }`}
            onClick={() => handleItemClick(item.id)}
            data-tooltip={item.label}
          >
            <div className="menu-item-icon">
              <i className={`fa-solid ${item.icon}`}></i>
            </div>
            <span className="menu-item-label">{item.label}</span>
          </div>
        ))}
      </div>
      
      <div className="sidebar-footer">
        <div className="sidebar-controls-hint">
          <i className="fa-solid fa-gamepad"></i>
          <span>Use as setas para navegar</span>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar; 