import React from "react";
import { Outlet, Link } from "react-router-dom";
import LoginButton from "./LoginButton";
import { useAuth0 } from "@auth0/auth0-react";
import '../styles.css';

const Navbar = () => {
  const { logout } = useAuth0();
  const { loginWithRedirect } = useAuth0();

  return (
    <nav className="navbar">
      <ul className="navbar-links">
        <li className="navbar-item">
          <Link to="/">Home</Link>
        </li>
        <li
          className="navbar-item"
          onClick={() => loginWithRedirect()}
          style={{ cursor: 'pointer' }}
        >
          Login
        </li>
        <li className="navbar-item">
          <Link to="/profile">Profile</Link>
        </li>
        <li
          className="navbar-item"
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          style={{ cursor: 'pointer' }}
        >
          Logout
        </li>
        <li className="navbar-item">
          <Link to="/feed">Feed</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;