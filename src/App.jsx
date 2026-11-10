
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";

export default function App() {
  const [cafes, setCafes] = useState([]);
  const [search, setSearch] = useState("");
  const [mood, setMood] = useState("All");
  const [price, setPrice] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);
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
        setError("Supabase configuration missing. Check your .env file.");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("cafes")
        .select(`
          id, name, location, city, category, description,
          mood_tags, price_level, opening_hours,
          crowd_status, cover_image_url
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
        cafe.name, cafe.location, cafe.city, cafe.category
      ].some((value) => value?.toLowerCase().includes(term));

      const matchesMood =
        mood === "All" || cafe.mood_tags?.includes(mood);

      const matchesPrice =
        price === "All" || cafe.price_level === price;

      return matchesSearch && matchesMood && matchesPrice;
    });
  }, [cafes, search, mood, price]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  }

  return (
    <main className="app-shell">
      <nav className="navbar">
        <a href="/" className="brand">CaféScape.</a>

        <div className="nav-actions">
          {user ? (
            <>
              <span>{user.email}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)}>
              Login / Sign up
            </button>
          )}
        </div>
      </nav>

      <section className="hero">
        <p className="eyebrow">YOUR CITY, YOUR COFFEE</p>
        <h1>Find your kind of café.</h1>
        <p>Discover real cafés around you.</p>

        <input
          type="search"
          placeholder="Search café, city or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      <section className="filters">
        <label>
          Mood
          <select value={mood} onChange={(e) => setMood(e.target.value)}>
            <option>All</option>
            <option>Cozy</option>
            <option>Study</option>
            <option>Social</option>
            <option>Romantic</option>
            <option>Peaceful</option>
          </select>
        </label>

        <label>
          Price
          <select value={price} onChange={(e) => setPrice(e.target.value)}>
            <option>All</option>
            <option>₹</option>
            <option>₹₹</option>
            <option>₹₹₹</option>
          </select>
        </label>
      </section>

      <section className="cafe-section">
        <h2>Explore cafés</h2>

        {loading && <p>Loading cafés...</p>}
        {error && <p role="alert">{error}</p>}

        {!loading && !error && filteredCafes.length === 0 && (
          <p>No approved cafés found yet.</p>
        )}

        <div className="cafe-grid">
          {filteredCafes.map((cafe) => (
            <article className="cafe-card" key={cafe.id}>
              {cafe.cover_image_url ? (
                <img
                  src={cafe.cover_image_url}
                  alt={cafe.name}
                  className="cafe-image"
                />
              ) : (
                <div className="cafe-image-placeholder">
                  Image not uploaded
                </div>
              )}

              <div className="cafe-info">
                <h3>{cafe.name}</h3>
                <p>{cafe.location}, {cafe.city}</p>
                {cafe.category && <p>{cafe.category}</p>}
                {cafe.description && <p>{cafe.description}</p>}
                {cafe.price_level && <p>{cafe.price_level}</p>}
                {cafe.opening_hours && <p>{cafe.opening_hours}</p>}
                <p>Crowd: {cafe.crowd_status}</p>
                {cafe.mood_tags?.length > 0 && (
                  <p>{cafe.mood_tags.join(" · ")}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {showAuth && (
        <div className="auth-overlay">
          <Auth onClose={() => setShowAuth(false)} />
        </div>
      )}
    </main>
  );
              }
