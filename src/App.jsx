
import { useMemo, useState } from "react";
import {
  Search, MapPin, SlidersHorizontal, Star,
  Heart, Clock3, ArrowRight, Coffee
} from "lucide-react";
import Navbar from "./components/Navbar";
import { cafes } from "./data/cafes";

const moods = ["All moods", "Peaceful", "Study", "Friends", "Date", "Aesthetic"];
const prices = ["All prices", "₹", "₹₹", "₹₹₹"];

function App() {
  const [search, setSearch] = useState("");
  const [mood, setMood] = useState("All moods");
  const [price, setPrice] = useState("All prices");
  const [saved, setSaved] = useState([]);

  const filteredCafes = useMemo(() => {
    return cafes.filter((cafe) => {
      const term = search.toLowerCase();

      const matchesSearch =
        cafe.name.toLowerCase().includes(term) ||
        cafe.location.toLowerCase().includes(term) ||
        cafe.category.toLowerCase().includes(term);

      const matchesMood =
        mood === "All moods" || cafe.mood.includes(mood);

      const matchesPrice =
        price === "All prices" || cafe.price === price;

      return matchesSearch && matchesMood && matchesPrice;
    });
  }, [search, mood, price]);

  function toggleSaved(id) {
    setSaved((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">
              <Coffee size={15} /> YOUR LITTLE CAFÉ UNIVERSE
            </span>

            <h1>
              Find your kind
              <br />
              of <span>coffee corner.</span>
            </h1>

            <p>
              From peaceful study spots to lively hangouts,
              discover a café that matches your mood.
            </p>

            <a className="primary-button" href="#explore">
              Explore cafés <ArrowRight size={18} />
            </a>

            <div className="hero-note">
              <span>☕</span>
              Discover. Save. Visit. Enjoy.
            </div>
          </div>

          <div className="hero-image-wrap">
            <img
              className="hero-image"
              src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1200"
              alt="Warm and cosy coffee shop interior"
            />
            <div className="floating-card glass">
              <span className="floating-icon">☕</span>
              <div>
                <strong>Your next favourite place</strong>
                <small>Just a discovery away</small>
              </div>
            </div>
          </div>
        </section>

        <section className="explore-section" id="explore">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LET'S FIND YOUR PLACE</span>
              <h2>Explore cafés</h2>
              <p>Search, discover and find your perfect vibe.</p>
            </div>
            <span className="result-count">
              {filteredCafes.length} places
            </span>
          </div>

          <div className="search-panel glass">
            <div className="search-box">
              <Search size={20} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search café, food or location..."
                aria-label="Search cafés"
              />
            </div>

            <div className="location-note">
              <MapPin size={17} />
              <span>Location filters coming soon</span>
            </div>
          </div>

          <div className="filter-heading">
            <SlidersHorizontal size={17} />
            <strong>Find your vibe</strong>
          </div>

          <div className="filter-group">
            {moods.map((item) => (
              <button
                key={item}
                className={`filter-chip ${mood === item ? "active" : ""}`}
                onClick={() => setMood(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="price-filters">
            <span>Price range</span>
            {prices.map((item) => (
              <button
                key={item}
                className={`price-chip ${price === item ? "active" : ""}`}
                onClick={() => setPrice(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="cafe-grid">
            {filteredCafes.map((cafe) => (
              <article className="cafe-card glass" key={cafe.id}>
                <div className="cafe-image-wrap">
                  <img src={cafe.image} alt={cafe.name} />
                  <button
                    className={`save-button ${
                      saved.includes(cafe.id) ? "saved" : ""
                    }`}
                    onClick={() => toggleSaved(cafe.id)}
                    aria-label="Save café"
                  >
                    <Heart
                      size={19}
                      fill={saved.includes(cafe.id) ? "currentColor" : "none"}
                    />
                  </button>
                  <span className="image-tag">{cafe.category}</span>
                </div>

                <div className="cafe-info">
                  <div className="cafe-title-row">
                    <h3>{cafe.name}</h3>
                    <span className="rating">
                      <Star size={15} fill="currentColor" />
                      {cafe.rating}
                    </span>
                  </div>

                  <p className="cafe-description">{cafe.description}</p>

                  <div className="cafe-meta">
                    <span><MapPin size={14} /> {cafe.location}</span>
                    <span><Clock3 size={14} /> {cafe.hours}</span>
                  </div>

                  <div className="cafe-bottom">
                    <strong>{cafe.price}</strong>
                    <span className={`crowd ${cafe.crowd.toLowerCase()}`}>
                      {cafe.crowd}
                    </span>
                    <button className="details-button">
                      Details <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredCafes.length === 0 && (
            <div className="empty-state glass">
              <Coffee size={32} />
              <h3>No cafés found</h3>
              <p>Try another search or change your filters.</p>
              <button
                className="text-button"
                onClick={() => {
                  setSearch("");
                  setMood("All moods");
                  setPrice("All prices");
                }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>

        <section className="saved-section" id="saved">
          <h2>Your saved cafés</h2>
          <p>
            {saved.length === 0
              ? "Cafés you save will be easy to find here."
              : `${saved.length} café(s) saved in this session.`}
          </p>
        </section>
      </main>

      <footer className="footer">
        <div className="brand footer-brand">
          <Coffee size={21} /> CaféScape
        </div>
        <p>Made for coffee lovers and café explorers.</p>
        <small>© 2026 CaféScape</small>
      </footer>
    </div>
  );
}

export default App;

              
