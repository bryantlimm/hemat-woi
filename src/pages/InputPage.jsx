// src/pages/InputPage.jsx
import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { UtensilsCrossed, Car, ShoppingCart, Gamepad2, Receipt, Heart, BookOpen, MoreHorizontal } from "lucide-react";
import { db } from "../firebase";

const CATEGORIES = [
  { id: "food", label: "Food & Drinks", Icon: UtensilsCrossed },
  { id: "transport", label: "Transport", Icon: Car },
  { id: "shopping", label: "Shopping", Icon: ShoppingCart },
  { id: "entertainment", label: "Entertainment", Icon: Gamepad2 },
  { id: "bills", label: "Bills", Icon: Receipt },
  { id: "health", label: "Health", Icon: Heart },
  { id: "education", label: "Education", Icon: BookOpen },
  { id: "other", label: "Other", Icon: MoreHorizontal },
];

export default function InputPage({ user, onSaved }) {
  const [type, setType] = useState("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [customCategory, setCustomCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!title.trim()) return setError("Please add a title.");
    const amt = parseFloat(amount.replace(/\D/g, ""));
    if (!amt || amt <= 0) return setError("Please enter a valid amount.");

    setLoading(true);
    try {
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        type,
        title: title.trim(),
        amount: amt,
        category: category === "other" && customCategory.trim() ? customCategory.trim() : category,
        createdAt: serverTimestamp(),
      });
      onSaved();
    } catch (e) {
      setError("Failed to save. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="page-content">
      <div className="input-page-title">New Entry</div>

      <div className="input-page-title">
            <p>Ingat buat hemat ya gais</p>
      </div>

      {/* Type toggle */}
      <div className="type-toggle">
        <button
          className={`type-btn expense ${type === "expense" ? "active" : ""}`}
          onClick={() => setType("expense")}
        >
          <span>−</span> Expense
        </button>
        <button
          className={`type-btn income ${type === "income" ? "active" : ""}`}
          onClick={() => setType("income")}
        >
          <span>+</span> Income
        </button>
      </div>

      <div className="form-card">
        {error && <div className="auth-error" style={{ marginBottom: 20 }}>{error}</div>}

        {/* Amount */}
        <div className="field">
          <label>Amount</label>
          <div className="amount-input-wrap">
            <span className="amount-prefix">Rp</span>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
            />
          </div>
        </div>

        {/* Title */}
        <div className="field">
          <label>Description</label>
          <input
            type="text"
            placeholder={type === "expense" ? "e.g. Dinner with friends" : "e.g. Monthly salary"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="field">
          <label>Category</label>
          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`cat-btn ${category === cat.id ? "active" : ""}`}
                onClick={() => setCategory(cat.id)}
              >
                <cat.Icon size={20} />
                <span style={{ fontSize: 11 }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom category field */}
        {category === "other" && (
          <div className="field">
            <label>Specify Category</label>
            <input
              type="text"
              placeholder="e.g. Gifts, Savings..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          </div>
        )}

        <button
          className={`btn-submit ${type}`}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : type === "expense" ? "− Record Expense" : "+ Record Income"}
        </button>
      </div>
    </main>
  );
}