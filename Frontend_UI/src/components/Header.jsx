import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";

import logo from "../assets/website-logo.png";

const Header = () => {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <img src={logo} alt="Scriber Logo" />
        </Link>
      </div>
    </header>
  );
};

export default Header;
