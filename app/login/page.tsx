import { LoginForm } from "./LoginForm";
import "../auth-pages.css";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return <main className="login-page">
    <a className="auth-back" href="/">← munshi.pk</a>
    <div className="login-card">
      <div className="auth-wordmark"><img src="/munshi-logo.png" alt="Munshi logo"/>MUNSHI<span>.</span></div>
      <div className="auth-tagline">Your books, sorted.</div>
      <div className="auth-tagline auth-stat">612 businesses · 1,840 clients tracked</div>
      <LoginForm error={error} next={next}/>
    </div>
  </main>;
}
