// src/pages/DataPage.jsx
import { useState, useEffect } from "react";
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, deleteDoc
} from "firebase/firestore";
import { UtensilsCrossed, Car, ShoppingCart, Gamepad2, Receipt, Heart, BookOpen, MoreHorizontal, Edit2, Trash2, Download } from "lucide-react";
import { db } from "../firebase";
import * as XLSX from "xlsx";

const fmt = (n) => "Rp " + Number(n).toLocaleString("id-ID");
const fmtDate = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtTime = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

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

export default function DataPage({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("transactions");
  const [editTx, setEditTx] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Filters
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [from, setFrom] = useState(firstOfMonth.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));

  useEffect(() => {
    const q = query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user.uid]);

  const filtered = transactions.filter((tx) => {
    if (!tx.createdAt) return true;
    const d = tx.createdAt.toDate();
    const fromD = new Date(from);
    const toD = new Date(to);
    toD.setHours(23, 59, 59);
    return d >= fromD && d <= toD;
  });

  const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Summary by category
  const summary = {};
  filtered.filter(t => t.type === "expense").forEach(t => {
    summary[t.category] = (summary[t.category] || 0) + t.amount;
  });
  const summaryArr = Object.entries(summary).sort((a, b) => b[1] - a[1]);

  const handleExport = () => {
    const rows = filtered.map((tx) => ({
      Date: fmtDate(tx.createdAt),
      Time: fmtTime(tx.createdAt),
      Type: tx.type,
      Description: tx.title,
      Category: tx.category,
      Amount: tx.type === "expense" ? -tx.amount : tx.amount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `hemat-woi-${from}-to-${to}.xlsx`);
  };

  return (
    <main className="page-content">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value income">{fmt(totalIncome)}</div>
        </div>
        <div className="stat-card" style={{ borderColor: totalExpense > 0 ? "#e8c0bc" : undefined }}>
          <div className="stat-label">Total Expense</div>
          <div className="stat-value expense">{fmt(totalExpense)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Balance</div>
          <div className="stat-value" style={{ color: balance >= 0 ? "var(--green)" : "var(--red)" }}>
            {fmt(balance)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Entries</div>
          <div className="stat-value">{filtered.length}</div>
        </div>
      </div>

      {/* Filter row */}
      <div className="filter-row">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="filter-sep">—</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="btn-ghost" onClick={() => {
          setFrom(firstOfMonth.toISOString().slice(0, 10));
          setTo(today.toISOString().slice(0, 10));
        }}>This Month</button>
        <button className="btn-export" onClick={handleExport}>
          <Download size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
          Export XLSX
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-row">
        <button className={`tab ${tab === "transactions" ? "active" : ""}`} onClick={() => setTab("transactions")}>Transactions</button>
        <button className={`tab ${tab === "summary" ? "active" : ""}`} onClick={() => setTab("summary")}>Summary</button>
      </div>

      {/* Transactions tab */}
      {tab === "transactions" && (
        <>
          {loading ? (
            <div className="empty-state"><div>Loading...</div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-text">No entries in this date range.</div>
            </div>
          ) : (
            <div className="tx-table">
                <div className="tx-header">
                    <span>Date</span>
                    <span>Type</span>
                    <span>Description</span>
                    <span>Category</span>
                    <span style={{ textAlign: "right" }}>Amount</span>
                    <span></span>
                </div>
                {filtered.map((tx) => {
                    const catIcon = CATEGORIES.find(c => c.id === tx.category);
                    return (
                        <div key={tx.id} className="tx-row">
                            <div className="tx-col-date">
                                <div className="tx-date">{fmtDate(tx.createdAt)}</div>
                                <div className="tx-date-sub">{fmtTime(tx.createdAt)}</div>
                            </div>
                            <div className="tx-col-type">
                                <span className={`badge ${tx.type}`}>
                                {tx.type === "income" ? "+ Income" : "− Expense"}
                                </span>
                            </div>
                            <div className="tx-col-desc">
                                <div className="tx-desc">{tx.title}</div>
                                <div className="tx-desc-sub" style={{ display: "none" }} aria-hidden></div>
                            </div>
                            <div className="tx-col-cat">
                                <span className="cat-pill">
                                {catIcon ? <catIcon.Icon size={14} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} /> : null}
                                {tx.category}
                                </span>
                            </div>
                            <div className={`tx-col-amount tx-amount ${tx.type}`}>
                                {tx.type === "expense" ? "− " : "+ "}{fmt(tx.amount).replace("Rp ", "")}
                            </div>
                            <div className="tx-col-actions tx-actions">
                                <button className="btn-icon" title="Edit" onClick={() => setEditTx({ ...tx })}><Edit2 size={16} /></button>
                                <button className="btn-icon" title="Delete" style={{ color: "var(--red)" }} onClick={() => setDeleteConfirm(tx.id)}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ); // <--- Added the missing closing parenthesis and semicolon here!
                })}
            </div>
          )}
        </>
      )}

      {/* Summary tab */}
      {tab === "summary" && (
        <div className="summary-grid">
          {summaryArr.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-text">No expenses in this range.</div>
            </div>
          ) : summaryArr.map(([cat, amt]) => (
            <div key={cat} className="summary-row">
              <div className="summary-cat">
                <span style={{ textTransform: "capitalize" }}>{cat}</span>
              </div>
              <div className="summary-val">{fmt(amt)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editTx && (
        <EditModal
          tx={editTx}
          uid={user.uid}
          onClose={() => setEditTx(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Delete this entry?</div>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="btn-save"
                style={{ background: "var(--red)" }}
                onClick={async () => {
                  await deleteDoc(doc(db, "users", user.uid, "transactions", deleteConfirm));
                  setDeleteConfirm(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function EditModal({ tx, uid, onClose }) {
  const [title, setTitle] = useState(tx.title);
  const [amount, setAmount] = useState(tx.amount);
  const [category, setCategory] = useState(
    CATEGORIES.find(c => c.id === tx.category) ? tx.category : "other"
  );
  const [type, setType] = useState(tx.type);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !amount) return;
    setSaving(true);
    await updateDoc(doc(db, "users", uid, "transactions", tx.id), {
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      type,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Edit Entry</div>

        <div className="type-toggle" style={{ marginBottom: 20 }}>
          <button className={`type-btn expense ${type === "expense" ? "active" : ""}`} onClick={() => setType("expense")}>− Expense</button>
          <button className={`type-btn income ${type === "income" ? "active" : ""}`} onClick={() => setType("income")}>+ Income</button>
        </div>

        <div className="field">
          <label>Amount</label>
          <div className="amount-input-wrap">
            <span className="amount-prefix">Rp</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Description</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="field">
          <label>Category</label>
          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} className={`cat-btn ${category === cat.id ? "active" : ""}`} onClick={() => setCategory(cat.id)}>
                <cat.Icon size={20} />
                <span style={{ fontSize: 11 }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}