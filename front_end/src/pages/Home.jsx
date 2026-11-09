import { Link } from "react-router-dom";

export default function Home() {
  const loggedIn = !!localStorage.getItem("token");

  return (
    <div className="home">
      <nav className="home-nav">
        <b>SecurePay</b>
        <span className="spacer" />
        {loggedIn ? (
          <Link className="btn small" to="/dashboard">Dashboard</Link>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link className="btn small" to="/register">Register</Link>
          </>
        )}
      </nav>

      <header className="hero">
        <h1>Secure peer-to-peer payments</h1>
        <p>
          Send money to anyone instantly. Every transaction is protected by a
          PIN, atomic database transactions and a tamper-evident hash-chained ledger.
        </p>
        <div className="hero-buttons">
          <Link className="btn" to={loggedIn ? "/dashboard" : "/register"}>Get started</Link>
          {!loggedIn && <Link className="btn outline" to="/login">Login</Link>}
        </div>
      </header>

      <section className="features">
        <div className="card"><h3>Wallet</h3><p>Add money and check your balance anytime.</p></div>
        <div className="card"><h3>PIN protected</h3><p>A separate transaction PIN is needed for every payment.</p></div>
        <div className="card"><h3>Safe transfers</h3><p>Atomic transactions mean money is never lost or duplicated.</p></div>
        <div className="card"><h3>Tamper-proof ledger</h3><p>Each transaction is a SHA-256 linked block, so edits are detected.</p></div>
      </section>

      <footer className="home-footer">SecurePay: Secure Payments System in P2P Network</footer>
    </div>
  );
}