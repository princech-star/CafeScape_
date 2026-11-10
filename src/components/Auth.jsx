import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth({ onClose }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        if (!fullName.trim()) {
          setError("Please enter your name.");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim()
            }
          }
        });

        if (error) throw error;

        if (data.session) {
          setMessage("Account created successfully. You are logged in.");
        } else {
          setMessage("Account created. Check your email if confirmation is required.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) throw error;

        setMessage("Login successful.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-card">
      <button
        type="button"
        className="auth-close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>

      <p className="eyebrow">WELCOME TO CAFÉSCAPE</p>

      <h2>
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h2>

      <p>
        {mode === "login"
          ? "Login to continue exploring cafés."
          : "Join CaféScape and discover cafés."}
      </p>

      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password (minimum 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : mode === "login"
              ? "Login"
              : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        {mode === "login"
          ? "Don't have an account?"
          : "Already have an account?"}

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setMessage("");
          }}
        >
          {mode === "login" ? "Sign up" : "Login"}
        </button>
      </p>
    </section>
  );
}
