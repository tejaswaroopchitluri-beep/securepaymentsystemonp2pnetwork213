import { useState } from "react";
import api, { errMsg } from "../api";

export default function Send() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  // one key per payment attempt: a double click or retry can never pay twice
  const [key, setKey] = useState(() => crypto.randomUUID());

  const search = async (value) => {
    setQuery(value);
    if (value.trim().length < 2) return setResults([]);
    try {
      const { data } = await api.get("/users/search", { params: { query: value } });
      setResults(data);
    } catch {
      setResults([]);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!receiver) return setMsg({ text: "Select a receiver first", type: "error" });
    try {
      const { data } = await api.post("/transactions/transfer", {
        receiverUsername: receiver.username,
        amount: Number(amount),
        pin,
        note,
        idempotencyKey: key,
      });
      setMsg({ text: `${data.message}: Rs.${amount} sent to @${receiver.username}`, type: "ok" });
      setAmount("");
      setPin("");
      setNote("");
      setReceiver(null);
      setQuery("");
      setResults([]);
      setKey(crypto.randomUUID());
    } catch (err) {
      setMsg({ text: errMsg(err), type: "error" });
    }
  };

  return (
    <div className="card">
      <h2>Send money</h2>
      {msg.text && (
        <p className={msg.type === "error" ? "error" : "success"}>{msg.text}</p>
      )}

      <input
        style={{ marginBottom: 10 }}
        placeholder="Search receiver by username"
        value={query}
        autoComplete="off"
        onChange={(e) => search(e.target.value)}
      />

      {results.length > 0 && !receiver && (
        <ul className="list">
          {results.map((u) => (
            <li
              key={u._id}
              onClick={() => {
                setReceiver(u);
                setResults([]);
                setQuery("");
              }}
            >
              {u.name} <small>@{u.username}</small>
            </li>
          ))}
        </ul>
      )}

      {receiver && (
        <p className="chosen">
          Sending to: <b>{receiver.name}</b> (@{receiver.username}){" "}
          <button type="button" className="btn small" onClick={() => setReceiver(null)}>
            Change
          </button>
        </p>
      )}

      <form onSubmit={send} autoComplete="off">
        <input
          type="number"
          min="1"
          placeholder="Amount"
          value={amount}
          autoComplete="off"
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          placeholder="Note (optional)"
          value={note}
          autoComplete="off"
          onChange={(e) => setNote(e.target.value)}
        />
        <input
          type="password"
          inputMode="numeric"
          placeholder="Transaction PIN"
          value={pin}
          autoComplete="new-password"
          onChange={(e) => setPin(e.target.value)}
          required
        />
        <button className="btn">Send</button>
      </form>
    </div>
  );
}