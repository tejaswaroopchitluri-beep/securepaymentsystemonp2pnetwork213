import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg } from "../api";

export default function Register() {
  const [form, setForm] = useState({ name: "", username: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", form);
      alert("Registered successfully. Please login.");
      navigate("/login");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="card auth">
      <h2>Create account</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={submit}>
        <input placeholder="Full name" value={form.name} onChange={set("name")} required />
        <input placeholder="Username" value={form.username} onChange={set("username")} required />
        <input type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
        <input placeholder="Phone" value={form.phone} onChange={set("phone")} required />
        <input type="password" placeholder="Password (min 6 characters)" value={form.password}
          onChange={set("password")} minLength={6} required />
        <button className="btn">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}