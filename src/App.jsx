// src/App.jsx
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import AuthPage from "./pages/AuthPage";
import MainApp from "./pages/MainApp";

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a2e1a" }}>
        <div style={{ color: "#a8d5a2", fontFamily: "monospace", fontSize: 16 }}>loading...</div>
      </div>
    );
  }

  return user ? <MainApp user={user} /> : <AuthPage />;
}