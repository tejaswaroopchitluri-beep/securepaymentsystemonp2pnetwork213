import { useEffect, useState } from "react";
import api, { errMsg } from "../api";

export default function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [reload, setReload] = useState(0);

  // runs on first load, and again whenever `reload` changes
  useEffect(() => {
    let active = true;
    api
      .get("/wallet/balance")
      .then(({ data }) => {
        if (!active) return;
        setBalance(data.balance);
        setName(data.name);
      })
      .catch((err) => {
        if (active) setMsg({ text: errMsg(err), type: "error" });
      });
    return () => {
      active = false;
    };
  }, [reload]);

  const deposit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/wallet/deposit", { amount: Number(amount) });
      setMsg({ text: `${data.message}. New balance: Rs.${data.balance}`, type: "ok" });
      setAmount("");
      setReload((n) => n + 1); // triggers the balance reload
    } catch (err) {
      setMsg({ text: errMsg(err), type: "error" });
    }
  };

  const savePin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/users/set-pin", { pin });
      setMsg({ text: data.message, type: "ok" });
      setPin("");
    } catch (err) {
      setMsg({ text: errMsg(err), type: "error" });
    }
  };

  return (
    <>
      <div className="card balance">
        <p>Welcome, {name}</p>
        <h1>Rs. {balance}</h1>
        <small>Wallet balance</small>
      </div>

      {msg.text && (
        <p className={msg.type === "error" ? "error" : "success"}>{msg.text}</p>
      )}

      <div className="grid">
        <div className="card">
          <h3>Add money</h3>
          <form onSubmit={deposit}>
            <input
              type="number"
              min="1"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <button className="btn">Add money</button>
          </form>
        </div>

        <div className="card">
          <h3>Set transaction PIN</h3>
          <form onSubmit={savePin}>
            <input
              type="password"
              inputMode="numeric"
              placeholder="4 to 6 digits"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              pattern="\d{4,6}"
              required
            />
            <button className="btn">Set PIN</button>
          </form>
          <small>You need a PIN to send or withdraw money. It can only be set once here.</small>
        </div>
      </div>
    </>
  );
}