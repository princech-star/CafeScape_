
import { Coffee, Heart, Search, UserRound, Menu } from "lucide-react";

export default function Navbar() {
  return (
    <header className="navbar glass">
      <a className="brand" href="#">
        <span className="brand-icon"><Coffee size={22} /></span>
        <span>CaféScape</span>
      </a>

      <nav className="desktop-nav">
        <a href="#home">Home</a>
        <a href="#explore">Explore</a>
        <a href="#explore">Search</a>
        <a href="#saved">Saved</a>
      </nav>

      <div className="nav-actions">
        <button className="icon-button" aria-label="Saved cafés">
          <Heart size={19} />
        </button>
        <button className="login-button">
          <UserRound size={17} />
          Login / Sign up
        </button>
        <button className="icon-button mobile-menu" aria-label="Menu">
          <Menu size={21} />
        </button>
      </div>
    </header>
  );
}
