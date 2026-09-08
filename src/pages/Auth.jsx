
import { useMemo, useState } from "react";
import Link from "../components/Link.jsx";
import { supabase } from "../supabaseClient.js";

function safeTarget() {
  const params = new URLSearchParams(window.location.search);
  const target = params.get("return_to") || "/dashboard";
  return target.startsWith("/") ? target : "/dashboard";
}

function friendlyAuthError(error, fallback) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (message.includes("email not confirmed")) return "Please confirm your email before logging in.";
  if (message.includes("user already registered")) return "An account with this email already exists.";
  if (message.includes("password")) return error.message || fallback;
  if (message.includes("rate limit")) return "Too many attempts. Please wait a little and try again.";
  return error?.message || fallback;
}

function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return <main className="auth-page">
    <header className="auth-header">
      <Link className="brand" href="/" aria-label="ADOPTVILLA home">
        <img className="dogsvilla-mark" src="/dogsvilla-logo.png" alt=""/>
        <span className="brand-divider" aria-hidden="true"/>
        <span><b>ADOPTVILLA</b><small>THE ADOPTION NETWORK</small></span>
      </Link>
      <Link className="auth-back" href="/">← Back to home</Link>
    </header>
    <section className="auth-layout">
      <aside className="auth-story" aria-hidden="true">
        <span className="kicker">{eyebrow}</span>
        <h1>Find the right home.<br/><em>Not just any home.</em></h1>
        <p>One calm account for pet discovery, responsible rehoming, foster support and trusted local animal-help workflows.</p>
        <div className="auth-points"><span>✓ Privacy-first</span><span>✓ Welfare-led matching</span><span>✓ One shared journey</span></div>
      </aside>
      <section className="auth-card-wrap">
        <div className="auth-card">
          <span className="kicker">{eyebrow}</span>
          <h2>{title}</h2>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
          {footer}
        </div>
      </section>
    </section>
  </main>;
}

export function LoginPage() {
  const target = useMemo(safeTarget, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    setBusy(false);

    if (signInError) {
      setError(friendlyAuthError(signInError, "Unable to log in. Please try again."));
      return;
    }

    window.location.href = target;
  };

  return <AuthShell eyebrow="WELCOME BACK" title="Log in to Adoptvilla" subtitle="Continue your adoption, foster or animal-care journey." footer={<p className="auth-switch">New to Adoptvilla? <Link href={`/signup?return_to=${encodeURIComponent(target)}`}>Create an account</Link></p>}>
    {error && <div className="auth-alert" role="alert">{error}</div>}
    <form className="auth-form" onSubmit={submit}>
      <label>Email address<input type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" required/></label>
      <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter your password" minLength={6} required/></label>
      <div className="auth-form-row"><label className="auth-check"><input type="checkbox"/> <span>Remember me</span></label><Link href="/forgot-password">Forgot password?</Link></div>
      <button className="primary auth-submit" type="submit" disabled={busy}>{busy ? "Logging in…" : "Log in →"}</button>
    </form>
  </AuthShell>;
}

export function SignupPage() {
  const target = useMemo(safeTarget, []);
  const [form, setForm] = useState({ fullName:"", contact:"", email:"", password:"", captcha:"" });
  const [challenge] = useState(() => { const a=3+Math.floor(Math.random()*6); const b=2+Math.floor(Math.random()*6); return {a,b}; });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (key) => (event) => setForm((current)=>({...current,[key]:event.target.value}));

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const fullName = form.fullName.trim();
    const contact = form.contact.trim();
    const email = form.email.trim().toLowerCase();

    if (fullName.length < 2) return setError("Enter your full name.");
    if (!/^[0-9+()\-\s]{8,16}$/.test(contact)) return setError("Enter a valid contact number.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (Number(form.captcha) !== challenge.a + challenge.b) return setError("Captcha answer is incorrect.");

    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: {
          full_name: fullName,
          phone: contact,
          contact,
        },
        emailRedirectTo: `${window.location.origin}${target}`,
      },
    });
    setBusy(false);

    if (signUpError) {
      setError(friendlyAuthError(signUpError, "Unable to create your account. Please try again."));
      return;
    }

    if (data.session) {
      window.location.href = target;
      return;
    }

    setSent(true);
  };

  return <AuthShell eyebrow="CREATE ACCOUNT" title="Join Adoptvilla" subtitle="Create one account for adoption, rehoming, foster and support workflows." footer={<p className="auth-switch">Already have an account? <Link href={`/login?return_to=${encodeURIComponent(target)}`}>Log in</Link></p>}>
    {error && <div className="auth-alert" role="alert">{error}</div>}
    {sent ? <div className="auth-success" role="status"><b>Check your email.</b><span>We sent a confirmation link to {form.email.trim()}. Open it to activate your Adoptvilla account.</span></div> : <form className="auth-form" onSubmit={submit}>
      <label>Full name<input value={form.fullName} onChange={set("fullName")} autoComplete="name" placeholder="Your full name" required/></label>
      <label>Contact number<input value={form.contact} onChange={set("contact")} inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" required/></label>
      <label>Email address<input type="email" value={form.email} onChange={set("email")} autoComplete="email" placeholder="you@example.com" required/></label>
      <label>Password<input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" placeholder="Minimum 6 characters" minLength={6} required/></label>
      <label className="captcha-field"><span>Captcha · What is {challenge.a} + {challenge.b}?</span><input value={form.captcha} onChange={set("captcha")} inputMode="numeric" placeholder="Your answer" required/></label>
      <button className="primary auth-submit" type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account →"}</button>
    </form>}
  </AuthShell>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError("Enter a valid email address.");

    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);

    if (resetError) {
      setError(friendlyAuthError(resetError, "Unable to send the reset link. Please try again."));
      return;
    }

    setSent(true);
  };

  return <AuthShell eyebrow="ACCOUNT RECOVERY" title="Forgot your password?" subtitle="Enter your email and we’ll send a secure password-reset link." footer={<p className="auth-switch"><Link href="/login">← Back to login</Link></p>}>
    {error && <div className="auth-alert" role="alert">{error}</div>}
    {sent ? <div className="auth-success" role="status"><b>Check your email.</b><span>If an account is eligible for recovery, a secure reset link has been sent to {email.trim()}.</span></div> : <form className="auth-form" onSubmit={submit}>
      <label>Email address<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required/></label>
      <button className="primary auth-submit" type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link →"}</button>
    </form>}
  </AuthShell>;
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setBusy(false);
      setError(friendlyAuthError(updateError, "This reset link is invalid or has expired. Request a new one."));
      return;
    }

    await supabase.auth.signOut();
    setBusy(false);
    setUpdated(true);
  };

  return <AuthShell eyebrow="ACCOUNT RECOVERY" title="Set a new password" subtitle="Choose a new password for your Adoptvilla account." footer={<p className="auth-switch"><Link href="/login">← Back to login</Link></p>}>
    {error && <div className="auth-alert" role="alert">{error}</div>}
    {updated ? <div className="auth-success" role="status"><b>Password updated.</b><span>Your new password is ready. Return to login to continue.</span></div> : <form className="auth-form" onSubmit={submit}>
      <label>New password<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" placeholder="Minimum 6 characters" minLength={6} required/></label>
      <label>Confirm password<input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Enter it again" minLength={6} required/></label>
      <button className="primary auth-submit" type="submit" disabled={busy}>{busy ? "Updating…" : "Update password →"}</button>
    </form>}
  </AuthShell>;
}