import React, { useState } from "react";
import "./App.css";

// Import Firebase functions
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { db } from "./firebase_config"; // Import config file
import { firebaseConfig } from './firebase_config'; // Import your firebaseConfig

// Define the shape of the Firestore data interface
interface User {
  name: string;
  email: string;
}

const App = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Initialize Firebase
  initializeApp(firebaseConfig);

  // Create a reference to the "users" collection
  const usersRef = collection(db, "users");

  // Function to handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      // Add a new document to the "users" collection
      await addDoc(usersRef, { name, email });
      console.log("User created successfully!");
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  return (
    <div>
      <h1 id = "PLEASEWORK">Welcome, React with TypeScript!</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <br />
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <br />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default App;