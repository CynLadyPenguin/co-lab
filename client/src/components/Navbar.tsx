import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import '../styles.css';
import TTS from "./TTS";

const Navbar = () => {
  const { logout } = useAuth0();
  const { loginWithRedirect } = useAuth0();
  const [speakText, setSpeakText] = useState('');
  const hoverTimeout = React.useRef<any>(null);

  const handleHover = (text: string) => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    hoverTimeout.current = setTimeout(() => {
      setSpeakText(text);
    }, 1000);
  };


  return (
    <nav className="navbar">
      <ul className="navbar-links">
        <li className="navbar-item" onMouseEnter={() => handleHover('Home')}>
          <Link to="/">Home</Link>
        </li>
        <li className="navbar-item">
          <Link to="/feed">Feed</Link>
        </li>
        <li
          className="navbar-item"
          onClick={() => loginWithRedirect()}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => handleHover('Login')}
        >
          Login
        </li>
        <li className="navbar-item" onMouseEnter={() => handleHover('Profile')}>
          <Link to="/profile">Profile</Link>
        </li>
        <li className="navbar-item">
          <Link to="/messages">Messages</Link>
        </li>
        <li
          className="navbar-item"
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => handleHover('Logout')}
        >
          Logout
        </li>
      </ul>
      {/* {speakText && <TTS text={speakText} />} */}
    </nav>
  );
};

export default Navbar;