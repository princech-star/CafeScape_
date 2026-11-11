import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  ArrowUpRight,
  Coffee,
  Sparkles,
  Menu,
  X
} from "lucide-react";

import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";

const moods = ["All", "Cozy", "Study", "Social", "Peaceful"];

export default function App() {
  const [cafes, setCafes] = useState([]);
  const [search, setSearch] = useState("");
  const [mood, setMood] = useState("All");
  const [price, setPrice] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadCafes() {
      if (!supabase) {
        setError("Supabase configuration missing. Check your environment variables.");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("cafes")
        .select(`
          id,
          name,
          location,
          city,
          category,
          description,
          mood_tags,
          price_level,
          opening_hours,
          crowd_status,
          cover_image_url
        `)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setCafes(data || []);
      }

      setLoading(false);
    }

    loadCafes();
  }, []);

  const filteredCafes = useMemo(() => {
    return cafes.filter((cafe) => {
      const term = search.toLowerCase();

      const matchesSearch = [
        cafe.name,
        cafe.location,
        cafe.city,
        cafe.category
      ].some((value) => value?.toLowerCase().includes(term));

      const matchesMood =
        mood === "All" || cafe.mood_tags?.includes(mood);

      const matchesPrice =
        price === "All" || cafe.price_level === price;

      return matchesSearch && matchesMood && matchesPrice;
    });
  }, [cafes, search, mood, price]);

  async function handleLogout() {
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) setError(logoutError.message);
  }

  function goToExplore() {
    document.getElementById("explore")?.scrollIntoView({
      behavior: "smooth"
    });
  }

  return (
    <main className="cs-app">
      <div className="cs-topline">
        FIND YOUR SPACE. SIP YOUR MOMENT.
      </div>

      <header className="cs-header">
        <a className="cs-logo" href="#home">
          <span className="cs-logo-mark"><Coffee size={19} /></span>
          <span>CaféScape<span className="cs-logo-dot">.</span></span>
        </a>

        <nav className={`cs-nav ${mobileMenu ? "cs-nav-open" : ""}`}>
          <a className="cs-nav-active" href="#home" onClick={() => setMobileMenu(false)}>Home</a>
          <a href="#explore" onClick={() => setMobileMenu(false)}>Explore</a>
          <a href="#about" onClick={() => setMobileMenu(false)}>About</a>
        </nav>

        <div className="cs-header-actions">
          {user ? (
            <>
              <span className="cs-user-email">{user.email}</span>
              <button className="cs-login-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="cs-login-btn" onClick={() => setShowAuth(true)}>
              Login / Sign up <ArrowUpRight size={15} />
            </button>
          )}
        </div>

        <button
          className="cs-mobile-toggle"
          aria-label="Toggle navigation"
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>
      </header>

      <section className="cs-hero" id="home">
        <div className="cs-hero-copy">
          <div className="cs-eyebrow">
            <Sparkles size={14} />
            YOUR LITTLE CORNER OF THE CITY
          </div>

          <h1>
            Find your
            <br />
            <em>kind of</em> café.
          </h1>

          <p className="cs-hero-description">
            Not just a coffee stop. Find a space that feels like you.
            Discover cafés for slow mornings, deep focus and good conversations.
          </p>

          <button className="cs-primary-btn" onClick={goToExplore}>
            Explore cafés <ArrowUpRight size={17} />
          </button>

          <div className="cs-hero-note">
            <span className="cs-note-line" />
            A better way to find your next favourite place.
          </div>
        </div>

        <div className="cs-hero-visual">
          <div className="cs-hero-image">
            <div className="cs-image-overlay">
              <span>THE CAFÉ EDIT</span>
              <p>Make room for a little pause.</p>
            </div>
          </div>

          <div className="cs-floating-card cs-floating-top">
            <span className="cs-floating-icon"><Coffee size={17} /></span>
            <span>
              <strong>Your next coffee spot</strong>
              <small>Waiting to be discovered</small>
            </span>
          </div>

          <div className="cs-floating-card cs-floating-bottom">
            <span className="cs-floating-number">01</span>
            <span>
              <strong>Find your atmosphere</strong>
              <small>Cozy · Calm · Creative</small>
            </span>
          </div>

          <span className="cs-hero-stamp">SIP SLOWLY<br />LIVE FULLY</span>
        </div>

        <div className="cs-hero-bottom">
          <span>01 / DISCOVER</span>
          <span>MADE FOR YOUR EVERYDAY ESCAPES</span>
        </div>
      </section>

      <section className="cs-discover" id="explore">
        <div className="cs-section-heading">
          <div>
            <span className="cs-section-kicker">THE DISCOVERY ROOM</span>
            <h2>Where will you <em>go today?</em></h2>
            <p>Search for a place that matches your mood.</p>
          </div>
          <span className="cs-section-number">01 — 03</span>
        </div>

        <div className="cs-search-panel">
          <div className="cs-search-input-wrap">
            <Search size={19} />
            <input
              type="search"
              placeholder="Search cafés, cities or locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="cs-search-divider" />

          <label className="cs-filter-select">
            <span>PRICE</span>
            <select value={price} onChange={(e) => setPrice(e.target.value)}>
              <option value="All">Any budget</option>
              <option value="₹">₹</option>
              <option value="₹₹">₹₹</option>
              <option value="₹₹₹">₹₹₹</option>
            </select>
          </label>

          <button className="cs-search-button" onClick={goToExplore}>
            Search <ArrowUpRight size={17} />
          </button>
        </div>

        <div className="cs-mood-row">
          <span className="cs-mood-label">I'M IN THE MOOD FOR</span>
          <div className="cs-mood-options">
            {moods.map((item) => (
              <button
                key={item}
                className={`cs-mood-chip ${mood === item ? "selected" : ""}`}
                onClick={() => setMood(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="cs-results-heading">
          <div>
            <span className="cs-section-kicker">CURATED FOR YOUR NEXT ESCAPE</span>
            <h3>Explore cafés<span>.</span></h3>
          </div>
          <span className="cs-results-count">
            {filteredCafes.length} {filteredCafes.length === 1 ? "PLACE" : "PLACES"}
          </span>
        </div>

        {loading && (
          <div className="cs-empty-state">
            <span className="cs-loader" />
            <p>Finding cafés for you...</p>
          </div>
        )}

        {error && <p className="cs-error" role="alert">{error}</p>}

        {!loading && !error && filteredCafes.length === 0 && (
          <div className="cs-empty-state">
            <Coffee size={30} />
            <h4>No cafés to show just yet.</h4>
            <p>
              {cafes.length === 0
                ? "Approved café listings will appear here when they are added."
                : "Try changing your search or filters."}
            </p>
          </div>
        )}

        <div className="cs-cafe-grid">
          {filteredCafes.map((cafe) => (
            <article className="cs-cafe-card" key={cafe.id}>
              <div className="cs-cafe-photo">
                {cafe.cover_image_url ? (
                  <img src={cafe.cover_image_url} alt={cafe.name} />
                ) : (
                  <div className="cs-no-photo">
                    <Coffee size={26} />
                    <span>PHOTO NOT ADDED</span>
                  </div>
                )}
                {cafe.price_level && (
                  <span className="cs-price-tag">{cafe.price_level}</span>
                )}
              </div>

              <div className="cs-cafe-details">
                <div className="cs-cafe-category">
                  {cafe.category || "CAFÉ"}
                </div>
                <h4>{cafe.name}</h4>
                <p className="cs-cafe-location">
                  <MapPin size={13} />
                  {cafe.location}, {cafe.city}
                </p>
                {cafe.description && (
                  <p className="cs-cafe-description">{cafe.description}</p>
                )}
                <div className="cs-cafe-meta">
                  {cafe.opening_hours && <span>{cafe.opening_hours}</span>}
                  <span>{cafe.crowd_status}</span>
                </div>
                {cafe.mood_tags?.length > 0 && (
                  <div className="cs-cafe-tags">
                    {cafe.mood_tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cs-about" id="about">
        <span className="cs-section-kicker">A LITTLE MORE THAN COFFEE</span>
        <h2>Good places make<br /><em>good moments.</em></h2>
        <p>
          CaféScape helps you discover spaces worth stepping into.
          Find your next quiet corner, creative hideaway or favourite table.
        </p>
      </section>

      <footer className="cs-footer">
        <a className="cs-logo" href="#home">
          <span className="cs-logo-mark"><Coffee size={18} /></span>
          <span>CaféScape<span className="cs-logo-dot">.</span></span>
        </a>
        <span>FIND YOUR SPACE. SIP YOUR MOMENT.</span>
        <a href="#home">BACK TO TOP ↑</a>
      </footer>

      {showAuth && (
        <div className="cs-auth-overlay">
          <Auth onClose={() => setShowAuth(false)} />
        </div>
      )}
    </main>
  );
      }
