// src/pages/MainApp.jsx
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import InputPage from "./InputPage";
import DataPage from "./DataPage";

export default function MainApp({ user }) {
  const [page, setPage] = useState("input"); // 'input' | 'data'
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-logo">hemat woi</div>
        <div className="topbar-actions">
          {page === "data" ? (
            <button className="btn-sm btn-accent" onClick={() => setPage("input")}>
              + New Entry
            </button>
          ) : (
            <button className="btn-sm btn-outline" onClick={() => setPage("data")}>
              See ur data
            </button>
          )}
          <button className="btn-sm btn-outline" onClick={() => signOut(auth)}>
            Sign Out
          </button>
        </div>
      </header>

      {page === "input" ? (
        <InputPage
          user={user}
          onSaved={() => { showToast("Entry saved!"); setPage("data"); }}
        />
      ) : (
        <DataPage user={user} />
      )}

      {toast && <div className="success-toast">{toast}</div>}
    </div>
  );
}