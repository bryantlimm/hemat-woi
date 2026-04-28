// src/pages/AuthPage.jsx
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function AuthPage() {
  const [tab, setTab] = useState("signin"); // 'signin' | 'signup' | 'forgot'
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => { setError(""); setInfo(""); };

  const handleSignUp = async () => {
    reset();
    const u = username.trim().toLowerCase();
    if (!u) return setError("Please choose a username.");
    if (!/^[a-z0-9_]{3,20}$/.test(u))
      return setError("Username must be 3–20 chars: letters, numbers, underscores only.");
    if (!email.trim()) return setError("Please enter your email.");
    if (!password) return setError("Please enter a password.");

    setLoading(true);
    try {
      // Check username availability
      const usernameSnap = await getDoc(doc(db, "usernames", u));
      if (usernameSnap.exists()) {
        setError("That username is already taken. Try another one.");
        setLoading(false);
        return;
      }

      // Create Firebase Auth account
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // Reserve username → email mapping
      await setDoc(doc(db, "usernames", u), {
        email: email.trim(),
        uid: cred.user.uid,
      });

      // Store username on user profile
      await setDoc(doc(db, "users", cred.user.uid, "profile", "info"), {
        username: u,
        email: email.trim(),
      });
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "That email is already registered.",
        "auth/invalid-email": "Invalid email address.",
        "auth/weak-password": "Password must be at least 6 characters.",
      };
      setError(msgs[e.code] || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    reset();
    const u = username.trim().toLowerCase();
    if (!u) return setError("Please enter your username.");
    if (!password) return setError("Please enter your password.");

    setLoading(true);
    try {
      // Look up email by username
      const usernameSnap = await getDoc(doc(db, "usernames", u));
      if (!usernameSnap.exists()) {
        setError("Username not found.");
        setLoading(false);
        return;
      }
      const { email: resolvedEmail } = usernameSnap.data();
      await signInWithEmailAndPassword(auth, resolvedEmail, password);
    } catch (e) {
      const msgs = {
        "auth/invalid-credential": "Incorrect password.",
        "auth/wrong-password": "Incorrect password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
      };
      setError(msgs[e.code] || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    reset();
    const u = username.trim().toLowerCase();
    if (!u) return setError("Enter your username to reset your password.");

    setLoading(true);
    try {
      const usernameSnap = await getDoc(doc(db, "usernames", u));
      // Always show generic message — don't reveal if username exists
      if (usernameSnap.exists()) {
        const { email: resolvedEmail } = usernameSnap.data();
        await sendPasswordResetEmail(auth, resolvedEmail);
      }
      setInfo("If that username exists, a reset link has been sent to the registered email.");
    } catch (e) {
      setError("Failed to send reset email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onEnter = (fn) => (e) => e.key === "Enter" && fn();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Cieee yg mau hemat</div>
        <div className="auth-tagline">bantuin meli dan chia hemat</div>

        {/* Tabs — hidden on forgot screen */}
        {tab !== "forgot" && (
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === "signin" ? "active" : ""}`}
              onClick={() => { setTab("signin"); reset(); }}>Sign In</button>
            <button className={`auth-tab ${tab === "signup" ? "active" : ""}`}
              onClick={() => { setTab("signup"); reset(); }}>Sign Up</button>
          </div>
        )}

        {/* Forgot header */}
        {tab === "forgot" && (
          <div style={{ marginBottom: 24 }}>
            <button onClick={() => { setTab("signin"); reset(); }}
              style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, fontWeight: 600, padding: 0, cursor: "pointer" }}>
              Back to Sign In
            </button>
            <div style={{ marginTop: 12, fontWeight: 600, fontSize: 18 }}>Reset Password</div>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
              Enter your username and we'll send a reset link to your registered email.
            </div>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}
        {info && (
          <div style={{ background: "var(--green-light)", color: "var(--green)", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {info}
          </div>
        )}

        {/* Username — always shown */}
        <div className="field">
          <label>Username</label>
          <input
            type="text"
            placeholder="your_username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onKeyDown={onEnter(tab === "signin" ? handleSignIn : tab === "signup" ? handleSignUp : handleForgotPassword)}
          />
        </div>

        {/* Email — sign up only */}
        {tab === "signup" && (
          <div className="field">
            <label>
              Email&nbsp;
              <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                (used only for password recovery)
              </span>
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onEnter(handleSignUp)}
            />
          </div>
        )}

        {/* Password — sign in & sign up */}
        {tab !== "forgot" && (
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onEnter(tab === "signin" ? handleSignIn : handleSignUp)}
            />
          </div>
        )}

        {/* Forgot password link */}
        {tab === "signin" && (
          <div style={{ textAlign: "right", marginBottom: 16, marginTop: -8 }}>
            <button onClick={() => { setTab("forgot"); reset(); }}
              style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>
              Forgot password?
            </button>
          </div>
        )}

        {tab === "signin" && (
          <button className="btn-primary" onClick={handleSignIn} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        )}
        {tab === "signup" && (
          <button className="btn-primary" onClick={handleSignUp} disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        )}
        {tab === "forgot" && (
          <button className="btn-primary" onClick={handleForgotPassword} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        )}
      </div>
    </div>
  );
}