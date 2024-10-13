import React, { useState, useEffect } from 'react';
import './App.css';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase_config'; // Import config file

const Component: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setMessage(`User ${userCredential.user.email} signed up successfully!`);

      // Add user to Firestore collection
      await addDoc(collection(db, 'users'), {
        email: userCredential.user.email,
        uid: userCredential.user.uid,
      });
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="container" data-component="container">
      <nav className="navbar" data-component="navbar">
        <ul>
          <li><a href="#home" data-component="navbar_home">Home</a></li>
          <li><a href="#about" data-component="navbar_about">About</a></li>
          <li><a href="#contact" data-component="navbar_contact">Contact</a></li>
        </ul>
      </nav>
      <h1 data-component="hello_world" className="red-text">Hello World!</h1>
      <form onSubmit={handleSignup} data-component="signup_form">
        <div>
          <label htmlFor="email" data-component="email_label">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-component="email_input"
          />
        </div>
        <div>
          <label htmlFor="password" data-component="password_label">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-component="password_input"
          />
        </div>
        <button type="submit" data-component="signup_button">Sign Up</button>
      </form>
      {message && <p data-component="signup_message">{message}</p>}
    </div>
  );
};

export default Component;