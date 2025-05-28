import React, { useState } from 'react';
import './LoginScreen.css';

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleContinue = () => {
    // Por enquanto, faz login direto como no app antigo
    // TODO: Implementar validação real quando necessário
    onLogin();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleContinue();
    }
  };

  return (
    <div className="login-screen">
      <img 
        src="/images/image-mesh-gradient.png" 
        className="background-image" 
        alt="Background" 
      />
      <div className="login-form">
        <img 
          src="/images/BIGTV-transparente.png" 
          className="logo-login" 
          alt="BIGTV Logo" 
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          onKeyPress={handleKeyPress}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          onKeyPress={handleKeyPress}
        />
        <button 
          id="continueButton" 
          onClick={handleContinue}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default LoginScreen; 