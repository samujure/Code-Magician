// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth"; // Import Firebase Authentication
import { getFirestore } from "firebase/firestore"; // Import Firestore

// My web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCLgWEqYoPdI_s6usvEJm9yXkwgpXwMZ4Y",
  authDomain: "codemagician-d04b1.firebaseapp.com",
  projectId: "codemagician-d04b1",
  storageBucket: "codemagician-d04b1.appspot.com",
  messagingSenderId: "393342730979",
  appId: "1:393342730979:web:eb54fa093a4ad36accfbd6",
  measurementId: "G-0Y5ZHZCD  BS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };