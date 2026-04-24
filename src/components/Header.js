import React from 'react';
import MeliusLogo from './MeliusLogo';

function Header() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening';

  return (
    <header className="header fade-up">
      <p className="header-eyebrow">{greeting}</p>
      <div className="header-brand">
        <MeliusLogo size={44} spinning={true} />
        <h1 className="logo">Melius<span>.</span></h1>
      </div>
      <p className="tagline">
        Your personal AI agent — plans your day, remembers your life, acts on your behalf.
      </p>
    </header>
  );
}

export default Header;