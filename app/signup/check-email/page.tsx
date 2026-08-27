import "../../auth-pages.css";

export default function CheckEmailPage() {
  return <main className="login-page"><div className="login-card check-email"><div className="auth-wordmark"><img src="/munshi-logo.png" alt="Munshi logo"/>MUNSHI<span>.</span></div><div className="stamp">✓</div><h1>Check your inbox</h1><p>We&apos;ve sent a confirmation link to your email. Open it to finish setting up your ledger.</p><a className="auth-submit" href="/login">Back to login</a></div></main>;
}
