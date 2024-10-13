import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar_HR_Dashboard.css';

const Navbar_HR_Dashboard = () => {
  return (
    <nav className="navbar">
      <ul className="navbar-nav">
        <li className="nav-item">
          <Link to="/about" className="nav-link">About Me</Link>
        </li>
        <li className="nav-item">
          <Link to="/employees" className="nav-link">Employee Page</Link>
        </li>
        <li className="nav-item">
          <Link to="/contracts" className="nav-link">Contract Page</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar_HR_Dashboard;