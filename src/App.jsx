import Portal from "./Portal";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  ArrowUpRight,
  Coffee,
  Sparkles,
  Menu,
  X,
  Heart,
  User,
  LogOut,
  Clock,
} from "lucide-react";
import { supabase } from "./lib/supabase";

const moods = ["All", "Cozy", "Study", "Social", "Peaceful"];

export default function App() {
  const [role, setRole] = useState(null);
  const [portalOpen, setPortalOpen] = useState(false);
  const [accountType, setAccountType] = useState("customer");

  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMood, setSelectedMood] = useState("All");
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  // Saved cafés
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(null);
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load cafés and authentication session
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadCafes() {
      const { data, error } = await supabase
        .from("cafes")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Cafe loading error:", error.message);
      } else {
        setCafes(data || []);
      }

      setLoading(false);
    }

    loadCafes();

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        console.error("Session error:", error.message);
        return;
      }

      setUser(data.session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load saved cafés whenever the logged-in user changes
  useEffect(() => {
    let active = true;

    async function loadFavorites() {
      if (!user || !supabase) {
        setFavorites([]);
        setFavoritesLoading(false);
        return;
      }

      setFavoritesLoading(true);
      setFavoriteMessage("");

      const { data, error } = await supabase
        .from("cafe_favorites")
        .select("cafe_id")
        .eq("user_id", user.id);

      if (!active) return;

      if (error) {
        console.error("Favorites loading error:", error.message);
        setFavoriteMessage("Saved cafés could not be loaded. Please try again.");
      } else {
        setFavorites((data || []).map((item) => item.cafe_id));
      }

      setFavoritesLoading(false);
    }

    loadFavorites();

    return () => {
      active = false;
    };
  }, [user]);
  

  // Load the logged-in user's role
  useEffect(() => {
    let active = true;

    async function loadRole() {
      if (!user || !supabase) {
        setRole(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!active) return;

      if (error) {
        console.error("Role loading error:", error.message);
        setRole(null);
        return;
      }

      setRole(data.role);
    }

    loadRole();

    return () => {
      active = false;
    };
  }, [user]);
  
  // Search and mood filters
  const filteredCafes = useMemo(() => {
    return cafes.filter((cafe) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        !searchText ||
        cafe.name?.toLowerCase().includes(searchText) ||
        cafe.location?.toLowerCase().includes(searchText) ||
        cafe.city?.toLowerCase().includes(searchText) ||
        cafe.category?.toLowerCase().includes(searchText);

      const tags = (cafe.mood_tags || []).map((tag) =>
        tag.toLowerCase()
      );

      const matchesMood =
        selectedMood === "All" ||
        tags.includes(selectedMood.toLowerCase());

      const matchesFavorites =
        !showFavoritesOnly || favorites.includes(cafe.id);

      return matchesSearch && matchesMood && matchesFavorites;
    });
  }, [cafes, search, selectedMood, favorites, showFavoritesOnly]);

  function goToExplore() {
    document.getElementById("explore")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  // Save or remove a café from Supabase
  async function toggleFavorite(id) {
    if (!supabase) {
      setFavoriteMessage("Saved cafés service is not configured.");
      return;
    }

    if (!user) {
      setAuthMode("login");
      setAuthMessage("Please sign in to save your favourite cafés.");
      setAuthOpen(true);
      return;
    }

    if (favoriteBusy) return;

    setFavoriteBusy(id);
    setFavoriteMessage("");

    const alreadySaved = favorites.includes(id);

    try {
      if (alreadySaved) {
        const { error } = await supabase
          .from("cafe_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("cafe_id", id);

        if (error) throw error;

        setFavorites((current) =>
          current.filter((cafeId) => cafeId !== id)
        );
      } else {
        const { error } = await supabase
          .from("cafe_favorites")
          .insert({
            user_id: user.id,
            cafe_id: id,
          });

        if (error) throw error;

        setFavorites((current) =>
          current.includes(id) ? current : [...current, id]
        );
      }
    } catch (error) {
      console.error("Favorite update error:", error.message);
      setFavoriteMessage(
        error.message || "Could not update saved café. Please try again."
      );
    } finally {
      setFavoriteBusy(null);
    }
  }

  // Login and signup
  async function handleAuth(event) {
    event.preventDefault();

    if (!supabase) {
      setAuthMessage("Login service is not configured yet.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
  full_name: authName,
  account_type: accountType,
},
          },
        });

        if (error) throw error;

        if (data.session) {
          setAuthOpen(false);
          setAuthEmail("");
          setAuthPassword("");
          setAuthName("");
        } else {
          setAuthMessage(
            "Account created! Please check your email and confirm your account before signing in."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });

        if (error) throw error;

        setAuthOpen(false);
        setAuthEmail("");
        setAuthPassword("");
        setAuthMessage("");
      }
    } catch (error) {
      setAuthMessage(error.message || "Something went wrong.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error.message);
    } else {
      setShowFavoritesOnly(false);
      setFavoriteMessage("");
    }
  }

  return (
    <div className="cs-app">
      <div className="cs-topline">
        A little more than coffee. A place to belong.
      </div>

      <header className="cs-header">
        <a href="#" className="cs-logo">
          <span className="cs-logo-icon">
            <Coffee size={20} />
          </span>
          <span>
            CaféScape<span className="cs-logo-dot">.</span>
          </span>
        </a>

        <nav className={`cs-nav ${mobileMenu ? "cs-nav-open" : ""}`}>
          <a href="#explore" onClick={() => setMobileMenu(false)}>
            Discover
          </a>
          <a href="#about" onClick={() => setMobileMenu(false)}>
            Our story
          </a>
          <a href="#footer" onClick={() => setMobileMenu(false)}>
            Contact
          </a>
        </nav>

        <div className="cs-header-actions">
          {user ? (
            <button className="cs-login-btn" onClick={handleLogout}>
              <LogOut size={16} />
              Sign out
            </button>
          ) : (
            <button
              className="cs-login-btn"
              onClick={() => {
                setAuthMode("login");
                setAuthMessage("");
                setAuthOpen(true);
              }}
            >
              <User size={16} />
              Sign in
            </button>
          )}

          <button
            className="cs-mobile-toggle"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main>
        <section className="cs-hero">
          <div className="cs-hero-content">
            <div className="cs-eyebrow">
              <Sparkles size={15} />
              YOUR LITTLE CORNER OF CALM
            </div>

            <h1>
              Find your
              <br />
              <em>kind</em> of coffee place.
            </h1>

            <p className="cs-hero-description">
              From quiet corners to creative conversations,
              discover cafés that feel a little like you.
            </p>

            <button className="cs-primary-btn" onClick={goToExplore}>
              Explore cafés
              <ArrowUpRight size={18} />
            </button>

            <div className="cs-hero-note">
              <span className="cs-note-line" />
              GOOD COFFEE. GOOD PLACES. GOOD DAYS.
            </div>
          </div>

          <div className="cs-hero-visual">
            <div className="cs-hero-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1200&q=85"
                alt="Warm and inviting café interior"
                className="cs-hero-image"
              />
            </div>

            <div className="cs-floating-card">
              <span className="cs-floating-icon">
                <Coffee size={19} />
              </span>
              <div>
                <strong>Your next favourite spot</strong>
                <span>is waiting to be discovered.</span>
              </div>
            </div>

            <div className="cs-hero-stamp">
              <span>THE</span>
              <strong>CAFÉ</strong>
              <span>SCAPE</span>
              <Sparkles size={17} />
            </div>
          </div>
        </section>

        <section className="cs-discover" id="explore">
          <div className="cs-section-heading">
            <div>
              <div className="cs-eyebrow">
                <span className="cs-eyebrow-dot" />
                FIND YOUR SPACE
              </div>
              <h2>
                Where shall we <em>go?</em>
              </h2>
              <p>
                A good café can change the mood of your whole day.
              </p>
            </div>

            <span className="cs-section-count">
              {cafes.length.toString().padStart(2, "0")} PLACES
            </span>
          </div>

          <div className="cs-search-panel">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by café, city or location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              className="cs-search-btn"
              onClick={goToExplore}
              aria-label="Search cafés"
            >
              <ArrowUpRight size={20} />
            </button>
          </div>

          <div className="cs-filter-row">
            <span className="cs-filter-label">THE VIBE</span>
            <div className="cs-mood-list">
              {moods.map((mood) => (
                <button
                  key={mood}
                  className={`cs-mood-chip ${
                    selectedMood === mood ? "active" : ""
                  }`}
                  onClick={() => setSelectedMood(mood)}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* All cafés / Saved cafés filter */}
          <div className="cs-filter-row">
            <span className="cs-filter-label">YOUR PLACES</span>
            <div className="cs-mood-list">
              <button
                className={`cs-mood-chip ${
                  !showFavoritesOnly ? "active" : ""
                }`}
                onClick={() => setShowFavoritesOnly(false)}
              >
                All cafés
              </button>

              <button
                className={`cs-mood-chip ${
                  showFavoritesOnly ? "active" : ""
                }`}
                onClick={() => {
                  if (!user) {
                    setAuthMode("login");
                    setAuthMessage("Please sign in to view your saved cafés.");
                    setAuthOpen(true);
                    return;
                  }

                  setShowFavoritesOnly(true);
                }}
              >
                <Heart size={14} />
                Saved by you ({favorites.length})
              </button>
            </div>
          </div>

          <div className="cs-results-heading">
            <h3>
              {showFavoritesOnly
                ? "Your saved places."
                : "Little places, big feelings."}
            </h3>
            <span>
              {filteredCafes.length}{" "}
              {filteredCafes.length === 1 ? "place" : "places"} found
            </span>
          </div>

          {favoriteMessage && (
            <p className="cs-auth-message" role="status">
              {favoriteMessage}
            </p>
          )}

          {loading || favoritesLoading ? (
            <div className="cs-empty-state">
              <Coffee size={30} />
              <h3>Finding your cafés...</h3>
              <p>Just a moment while we fetch the places.</p>
            </div>
          ) : filteredCafes.length > 0 ? (
            <div className="cs-cafe-grid">
              {filteredCafes.map((cafe) => (
                <article className="cs-cafe-card" key={cafe.id}>
                  <div className="cs-cafe-photo-wrap">
                    {cafe.cover_image_url ? (
                      <img
                        src={cafe.cover_image_url}
                        alt={cafe.name}
                        className="cs-cafe-photo"
                      />
                    ) : (
                      <div className="cs-no-photo">
                        <Coffee size={30} />
                        <span>PHOTO NOT ADDED</span>
                      </div>
                    )}

                    <button
                      className={`cs-favorite-btn ${
                        favorites.includes(cafe.id) ? "is-favorite" : ""
                      }`}
                      onClick={() => toggleFavorite(cafe.id)}
                      disabled={favoriteBusy === cafe.id}
                      aria-label={
                        favorites.includes(cafe.id)
                          ? "Remove café from saved places"
                          : "Save café"
                      }
                      aria-pressed={favorites.includes(cafe.id)}
                    >
                      <Heart
                        size={18}
                        fill={
                          favorites.includes(cafe.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>

                    {cafe.category && (
                      <span className="cs-cafe-category">
                        {cafe.category}
                      </span>
                    )}
                  </div>

                  <div className="cs-cafe-info">
                    <div className="cs-cafe-title-row">
                      <h3>{cafe.name}</h3>
                      <ArrowUpRight size={18} />
                    </div>

                    <p className="cs-cafe-location">
                      <MapPin size={14} />
                      {cafe.location}
                      {cafe.city ? `, ${cafe.city}` : ""}
                    </p>

                    {cafe.description && (
                      <p className="cs-cafe-description">
                        {cafe.description}
                      </p>
                    )}

                    <div className="cs-cafe-meta">
                      {cafe.price_level && (
                        <span>{cafe.price_level}</span>
                      )}

                      {cafe.opening_hours && (
                        <span>
                          <Clock size={13} />
                          {cafe.opening_hours}
                        </span>
                      )}
                    </div>

                    <div className="cs-cafe-bottom">
                      <div className="cs-cafe-tags">
                        {(cafe.mood_tags || []).slice(0, 3).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>

                      <span className="cs-crowd-status">
                        {cafe.crowd_status || "Not updated"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="cs-empty-state">
              <Coffee size={32} />
              <h3>
                {showFavoritesOnly
                  ? "No saved cafés yet."
                  : "No cafés found just yet."}
              </h3>
              <p>
                {showFavoritesOnly
                  ? "Tap the heart on a café to save it here."
                  : cafes.length === 0
                  ? "Approved cafés will appear here when they are added."
                  : "Try another search or choose a different vibe."}
              </p>

              {showFavoritesOnly && (
                <button
                  className="cs-text-btn"
                  onClick={() => setShowFavoritesOnly(false)}
                >
                  Explore all cafés
                </button>
              )}

              {(search || selectedMood !== "All") && (
                <button
                  className="cs-text-btn"
                  onClick={() => {
                    setSearch("");
                    setSelectedMood("All");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>

        <section className="cs-about" id="about">
          <div className="cs-about-decoration">
            <Coffee size={38} strokeWidth={1} />
          </div>

          <div className="cs-eyebrow">
            <span className="cs-eyebrow-dot" />
            A NOTE FROM US
          </div>

          <h2>
            Not just a café.
            <br />
            <em>A feeling.</em>
          </h2>

          <p>
            We believe the best places aren't always the loudest
            or the most popular. Sometimes, they're the little
            corners where time slows down, ideas flow, and
            ordinary days feel special.
          </p>

          <span className="cs-about-signature">
            Made for your kind of day.
          </span>
        </section>
      </main>

      <footer className="cs-footer" id="footer">
        <a href="#" className="cs-logo">
          <span className="cs-logo-icon">
            <Coffee size={20} />
          </span>
          <span>
            CaféScape<span className="cs-logo-dot">.</span>
          </span>
        </a>

        <p>Discover places. Find your pace.</p>

        <span className="cs-footer-copy">
          © {new Date().getFullYear()} CaféScape
        </span>
      </footer>

      {authOpen && (
        <div
          className="cs-auth-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setAuthOpen(false);
            }
          }}
        >
          <div className="cs-auth-card">
            <button
              className="cs-auth-close"
              onClick={() => setAuthOpen(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="cs-auth-icon">
              <Coffee size={25} />
            </div>

            <div className="cs-eyebrow">WELCOME TO CAFÉSCAPE</div>

            <h2>
              {authMode === "login"
                ? "Good to see you."
                : "Join our little world."}
            </h2>

            <p className="cs-auth-description">
              {authMode === "login"
                ? "Sign in to continue your café journey."
                : "Create an account and start discovering."}
            </p>

            
<form onSubmit={handleAuth} className="cs-auth-form">
  {authMode === "signup" && (
    <>
      <input
        type="text"
        placeholder="Your full name"
        value={authName}
        onChange={(event) => setAuthName(event.target.value)}
        required
      />

      <select
        value={accountType}
        onChange={(event) => setAccountType(event.target.value)}
        required
      >
        <option value="customer">Customer account</option>
        <option value="cafe_owner">Café Owner account</option>
      </select>
    </>
  )}

  <input
    type="email"
    placeholder="Email address"
    value={authEmail}
    onChange={(event) => setAuthEmail(event.target.value)}
    required
  />
  
              <input
                type="password"
                placeholder="Password (minimum 8 characters)"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                minLength={8}
                required
              />

              {authMessage && (
                <p className="cs-auth-message" role="status">
                  {authMessage}
                </p>
              )}

              <button
                type="submit"
                className="cs-primary-btn cs-auth-submit"
                disabled={authLoading}
              >
                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                  ? "Sign in"
                  : "Create account"}
                <ArrowUpRight size={18} />
              </button>
            </form>

            <p className="cs-auth-switch">
              {authMode === "login"
                ? "New to CaféScape?"
                : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setAuthMode(
                    authMode === "login" ? "signup" : "login"
                  );
                  setAuthMessage("");
                }}
              >
                {authMode === "login" ? "Create account" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
