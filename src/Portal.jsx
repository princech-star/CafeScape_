
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #dfd2c1",
  borderRadius: "12px",
  background: "#fffdf9",
  color: "#493629",
  fontSize: "14px",
  boxSizing: "border-box",
};

const buttonStyle = {
  padding: "11px 16px",
  border: "0",
  borderRadius: "12px",
  background: "#654633",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};

const panelStyle = {
  background: "#fffaf2",
  border: "1px solid #eadfce",
  borderRadius: "18px",
  padding: "20px",
  marginBottom: "16px",
};

export default function Portal({ user, role, onBack, onRefresh }) {
  const [cafes, setCafes] = useState([]);
  const [selectedCafe, setSelectedCafe] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [cafeForm, setCafeForm] = useState({
    name: "",
    location: "",
    city: "",
    category: "Cafe",
    description: "",
    price_level: "₹₹",
    opening_hours: "",
    mood_tags: "",
    cover_image_url: "",
  });

  const [menuForm, setMenuForm] = useState({
    item_name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
  });

  async function loadCafes() {
    if (!user || !supabase) return;

    setLoading(true);
    setError("");

    let query = supabase.from("cafes").select("*");

    if (role === "cafe_owner") {
      query = query.eq("owner_id", user.id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      setError(error.message);
      setCafes([]);
    } else {
      setCafes(data || []);
    }

    setLoading(false);
  }

  async function loadMenu(cafeId) {
    if (!cafeId) {
      setMenuItems([]);
      return;
    }

    const { data, error } = await supabase
      .from("cafe_menu_items")
      .select("*")
      .eq("cafe_id", cafeId)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setMenuItems(data || []);
  }

  useEffect(() => {
    loadCafes();
  }, [user?.id, role]);

  useEffect(() => {
    if (cafes.length === 0) {
      setSelectedCafe("");
      setMenuItems([]);
      return;
    }

    const currentExists = cafes.some(
      (cafe) => cafe.id === selectedCafe
    );

    if (!currentExists) {
      setSelectedCafe(cafes[0].id);
    }
  }, [cafes]);

  useEffect(() => {
    loadMenu(selectedCafe);
  }, [selectedCafe]);

  async function registerCafe(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const payload = {
      ...cafeForm,
      owner_id: user.id,
      is_approved: false,
      approval_status: "pending",
      mood_tags: cafeForm.mood_tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      cover_image_url: cafeForm.cover_image_url.trim() || null,
      opening_hours: cafeForm.opening_hours.trim() || null,
      description: cafeForm.description.trim() || null,
    };

    const { error } = await supabase
      .from("cafes")
      .insert(payload);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Café registration submitted for admin review.");
      setCafeForm({
        name: "",
        location: "",
        city: "",
        category: "Cafe",
        description: "",
        price_level: "₹₹",
        opening_hours: "",
        mood_tags: "",
        cover_image_url: "",
      });
      await loadCafes();
      onRefresh?.();
    }

    setBusy(false);
  }

  async function addMenuItem(event) {
    event.preventDefault();

    if (!selectedCafe) return;

    setBusy(true);
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("cafe_menu_items")
      .insert({
        cafe_id: selectedCafe,
        item_name: menuForm.item_name.trim(),
        description: menuForm.description.trim() || null,
        price: Number(menuForm.price),
        category: menuForm.category.trim() || null,
        image_url: menuForm.image_url.trim() || null,
      });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Menu item added.");
      setMenuForm({
        item_name: "",
        description: "",
        price: "",
        category: "",
        image_url: "",
      });
      await loadMenu(selectedCafe);
    }

    setBusy(false);
  }
async function updateMenuItem(item) {
  setBusy(true);
  setError("");
  setMessage("");

  const { error } = await supabase
    .from("cafe_menu_items")
    .update({
      item_name: item.item_name,
      description: item.description,
      price: Number(item.price),
      category: item.category,
      image_url: item.image_url,
    })
    .eq("id", item.id);

  if (error) {
    setError(error.message);
  } else {
    setMessage("Menu item updated successfully.");
    await loadMenu(selectedCafe);
  }

  setBusy(false);
}
  async function toggleAvailability(item) {
    const { error } = await supabase
      .from("cafe_menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);

    if (error) {
      setError(error.message);
    } else {
      await loadMenu(selectedCafe);
    }
  }

  async function deleteMenuItem(itemId) {
    if (!window.confirm("Delete this menu item?")) return;

    const { error } = await supabase
      .from("cafe_menu_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Menu item deleted.");
      await loadMenu(selectedCafe);
    }
  }

  async function reviewCafe(cafe, status) {
    const note =
      status === "changes_requested"
        ? window.prompt("What changes should the owner make?")
        : status === "rejected"
        ? window.prompt("Reason for rejection:")
        : "";

    if (note === null) return;

    setBusy(true);
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("cafes")
      .update({
        approval_status: status,
        is_approved: status === "approved",
        admin_note: note || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", cafe.id);

    if (error) {
      setError(error.message);
    } else {
      setMessage(
        status === "approved"
          ? "Café approved and published."
          : status === "rejected"
          ? "Café application rejected."
          : "Changes requested from café owner."
      );

      await loadCafes();
      onRefresh?.();
    }

    setBusy(false);
  }

  if (role !== "admin" && role !== "cafe_owner") {
    return (
      <main style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
        <h2>Portal access unavailable</h2>
        <p>Your account does not have a café owner or admin role.</p>
        <button style={buttonStyle} onClick={onBack}>
          Back to CaféScape
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 1050,
        margin: "0 auto",
        padding: "32px 18px 70px",
        color: "#493629",
        minHeight: "70vh",
      }}
    >
      <button
        style={{ ...buttonStyle, marginBottom: 22 }}
        onClick={onBack}
      >
        ← Back to website
      </button>

      <div style={panelStyle}>
        <p style={{ color: "#98765b", margin: 0 }}>
          CAFÉSCAPE MANAGEMENT
        </p>
        <h1 style={{ margin: "8px 0" }}>
          {role === "admin" ? "Admin Dashboard" : "Café Owner Dashboard"}
        </h1>
        <p style={{ marginBottom: 0, overflowWrap: "anywhere" }}>
          Signed in as {user.email}
        </p>
      </div>

      {message && (
        <p role="status" style={{ color: "#287344" }}>
          {message}
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "#b42318" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading dashboard...</p>
      ) : role === "cafe_owner" ? (
        <>
          {cafes.length === 0 && (
  <section style={panelStyle}>
    <h2>Register your café</h2>
            <p>Submit accurate café details for admin verification.</p>

            <form
              onSubmit={registerCafe}
              style={{ display: "grid", gap: 12 }}
            >
              <input
                style={inputStyle}
                placeholder="Café name"
                required
                value={cafeForm.name}
                onChange={(e) =>
                  setCafeForm({ ...cafeForm, name: e.target.value })
                }
              />

              <input
                style={inputStyle}
                placeholder="Full address / campus / area"
                required
                value={cafeForm.location}
                onChange={(e) =>
                  setCafeForm({ ...cafeForm, location: e.target.value })
                }
              />

              <input
                style={inputStyle}
                placeholder="City"
                required
                value={cafeForm.city}
                onChange={(e) =>
                  setCafeForm({ ...cafeForm, city: e.target.value })
                }
              />

              <input
                style={inputStyle}
                placeholder="Category (Cafe, Coffee Shop, Bakery...)"
                value={cafeForm.category}
                onChange={(e) =>
                  setCafeForm({ ...cafeForm, category: e.target.value })
                }
              />

              <textarea
                style={inputStyle}
                placeholder="Café description"
                rows={3}
                value={cafeForm.description}
                onChange={(e) =>
                  setCafeForm({
                    ...cafeForm,
                    description: e.target.value,
                  })
                }
              />

              <select
                style={inputStyle}
                value={cafeForm.price_level}
                onChange={(e) =>
                  setCafeForm({
                    ...cafeForm,
                    price_level: e.target.value,
                  })
                }
              >
                <option value="₹">₹ - Budget</option>
                <option value="₹₹">₹₹ - Moderate</option>
                <option value="₹₹₹">₹₹₹ - Premium</option>
              </select>

              <input
                style={inputStyle}
                placeholder="Actual opening hours"
                value={cafeForm.opening_hours}
                onChange={(e) =>
                  setCafeForm({
                    ...cafeForm,
                    opening_hours: e.target.value,
                  })
                }
              />

              <input
                style={inputStyle}
                placeholder="Mood tags separated by commas"
                value={cafeForm.mood_tags}
                onChange={(e) =>
                  setCafeForm({
                    ...cafeForm,
                    mood_tags: e.target.value,
                  })
                }
              />

              <input
                style={inputStyle}
                placeholder="Café photo URL (optional)"
                type="url"
                value={cafeForm.cover_image_url}
                onChange={(e) =>
                  setCafeForm({
                    ...cafeForm,
                    cover_image_url: e.target.value,
                  })
                }
              />

              <button style={buttonStyle} disabled={busy}>
                {busy ? "Submitting..." : "Submit café for approval"}
              </button>
            </form>
          </section>
          )}

          <section style={panelStyle}>
            <h2>Your café applications</h2>

            {cafes.length === 0 ? (
              <p>You have not registered a café yet.</p>
            ) : (
              cafes.map((cafe) => (
                <div
                  key={cafe.id}
                  style={{
                    borderTop: "1px solid #eadfce",
                    padding: "14px 0",
                  }}
                >
                  <strong>{cafe.name}</strong>
                  <p>{cafe.location}, {cafe.city}</p>
                  <p>
                    Application status: <strong>{cafe.approval_status}</strong>
                  </p>
                  {cafe.admin_note && (
                    <p>Admin note: {cafe.admin_note}</p>
                  )}
                </div>
              ))
            )}
          </section>

          {cafes.length > 0 && (
            <section style={panelStyle}>
              <h2>Manage café menu</h2>

              <select
                style={inputStyle}
                value={selectedCafe}
                onChange={(e) => setSelectedCafe(e.target.value)}
              >
                {cafes.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>
                    {cafe.name} — {cafe.approval_status}
                  </option>
                ))}
              </select>

              <form
                onSubmit={addMenuItem}
                style={{ display: "grid", gap: 12, marginTop: 16 }}
              >
                <input
                  style={inputStyle}
                  placeholder="Menu item name"
                  required
                  value={menuForm.item_name}
                  onChange={(e) =>
                    setMenuForm({
                      ...menuForm,
                      item_name: e.target.value,
                    })
                  }
                />

                <input
                  style={inputStyle}
                  placeholder="Price in INR"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={menuForm.price}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, price: e.target.value })
                  }
                />

                <input
                  style={inputStyle}
                  placeholder="Menu category (optional)"
                  value={menuForm.category}
                  onChange={(e) =>
                    setMenuForm({
                      ...menuForm,
                      category: e.target.value,
                    })
                  }
                />

                <input
                  style={inputStyle}
                  placeholder="Description (optional)"
                  value={menuForm.description}
                  onChange={(e) =>
                    setMenuForm({
                      ...menuForm,
                      description: e.target.value,
                    })
                  }
                />

                <input
                  style={inputStyle}
                  placeholder="Item photo URL (optional)"
                  type="url"
                  value={menuForm.image_url}
                  onChange={(e) =>
                    setMenuForm({
                      ...menuForm,
                      image_url: e.target.value,
                    })
                  }
                />

                <button style={buttonStyle} disabled={busy}>
                  Add menu item
                </button>
              </form>

              <h3>Existing menu items</h3>

              {menuItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderTop: "1px solid #eadfce",
                    padding: "12px 0",
                  }}
                >
                  <strong>{item.item_name}</strong>
                  <span> — ₹{item.price}</span>
                  <p>
                    {item.is_available ? "Available" : "Unavailable"}
                  </p>
                  <button
                    style={buttonStyle}
                    onClick={() => toggleAvailability(item)}
                  >
                    Toggle availability
                  </button>{" "}
                  <button
                    style={{
                      ...buttonStyle,
                      background: "#9a4439",
                    }}
                    onClick={() => deleteMenuItem(item.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </section>
          )}
        </>
      ) : (
  <>
    <section style={panelStyle}>
      <h2>Café applications</h2>

{cafes.filter(
  (cafe) => cafe.approval_status !== "approved"
).length === 0 ? (
  <p>No pending café applications found.</p>
) : (
  cafes
    .filter((cafe) => cafe.approval_status !== "approved")
    .map((cafe) => (
      
          
              <article
                key={cafe.id}
                style={{
                  borderTop: "1px solid #eadfce",
                  padding: "18px 0",
                }}
              >
                <h3>{cafe.name}</h3>
                <p>{cafe.location}, {cafe.city}</p>
                <p>{cafe.description}</p>
                <p>Owner ID: {cafe.owner_id || "Not assigned"}</p>
                <p>
                  Status: <strong>{cafe.approval_status}</strong>
                </p>

                {cafe.cover_image_url && (
                  <img
                    src={cafe.cover_image_url}
                    alt={cafe.name}
                    style={{
                      width: "100%",
                      maxWidth: 300,
                      borderRadius: 12,
                    }}
                  />
                )}

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <button
                    style={{
                      ...buttonStyle,
                      background: "#287344",
                    }}
                    disabled={busy || cafe.approval_status === "approved"}
                    onClick={() => reviewCafe(cafe, "approved")}
                  >
                    Approve
                  </button>

                  <button
                    style={{
                      ...buttonStyle,
                      background: "#a33b32",
                    }}
                    disabled={busy}
                    onClick={() => reviewCafe(cafe, "rejected")}
                  >
                    Reject
                  </button>

                  <button
                    style={{
                      ...buttonStyle,
                      background: "#987044",
                    }}
                    disabled={busy}
                    onClick={() =>
                      reviewCafe(cafe, "changes_requested")
                    }
                  >
                    Request changes
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      <section style={panelStyle}>
  <h2>Approved Cafés</h2>

  {cafes.filter(
    (cafe) => cafe.approval_status === "approved"
  ).length === 0 ? (
    <p>No approved cafés yet.</p>
  ) : (
    cafes
      .filter((cafe) => cafe.approval_status === "approved")
      .map((cafe) => (
        <div
          key={cafe.id}
          style={{
            borderTop: "1px solid #eadfce",
            padding: "14px 0",
          }}
        >
          <strong>{cafe.name}</strong>
          <p>{cafe.location}, {cafe.city}</p>
          <p>Status: Approved</p>
        </div>
      ))
  )}
</section>
  </>
      )}
    </main>
  );
      }
        
