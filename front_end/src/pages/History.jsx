import { useEffect, useState } from "react";
import api, { errMsg } from "../api";

export default function History() {
  const [txs, setTxs] = useState([]);
  const [error, setError] = useState("");
  const me = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    api.get("/transactions")
      .then(({ data }) => setTxs(data))
      .catch((err) => setError(errMsg(err)));
  }, []);

  // money in or out, from this user's point of view
  const describe = (t) => {
    if (t.type === "deposit") return { label: "Deposit", sign: "+", who: "Wallet top-up" };
    if (t.type === "withdrawal") return { label: "Withdrawal", sign: "-", who: "Wallet" };
    const sent = t.senderId?._id === me.id;
    return sent
      ? { label: "Sent", sign: "-", who: `to @${t.receiverId?.username}` }
      : { label: "Received", sign: "+", who: `from @${t.senderId?.username}` };
  };

  return (
    <div className="card">
      <h2>Transaction history</h2>
      {error && <p className="error">{error}</p>}
      {txs.length === 0 && !error && <p>No transactions yet.</p>}

      {txs.length > 0 && (
        <div className="scroll">
          <table>
            <thead>
              <tr><th>Date</th><th>Type</th><th>Details</th><th>Amount</th><th>Status</th><th>Block hash</th></tr>
            </thead>
            <tbody>
              {txs.map((t) => {
                const d = describe(t);
                return (
                  <tr key={t._id}>
                    <td>{new Date(t.timestamp).toLocaleString()}</td>
                    <td>{d.label}</td>
                    <td>{d.who}{t.note ? ` (${t.note})` : ""}</td>
                    <td className={d.sign === "+" ? "plus" : "minus"}>{d.sign} Rs.{t.amount}</td>
                    <td>{t.status}</td>
                    <td title={t.hash}><code>{t.hash.slice(0, 10)}...</code></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}