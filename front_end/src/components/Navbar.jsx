import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="nav">
      <NavLink to="/" end><b>SecurePay</b></NavLink>
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/send">Send Money</NavLink>
      <NavLink to="/history">History</NavLink>
      <span className="spacer" />
      <span>@{user.username}</span>
      <button className="btn small" onClick={logout}>Logout</button>
    </nav>
  );
}