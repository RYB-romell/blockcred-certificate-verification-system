// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
   apiKey: "AIzaSyAQFkWeSX2XWPkkpz_a016jQfJaYoO8r3o",
  authDomain: "blockcred-4dbc6.firebaseapp.com",
  projectId: "blockcred-4dbc6",
  storageBucket: "blockcred-4dbc6.firebasestorage.app",
  messagingSenderId: "681274244940",
  appId: "1:681274244940:web:95c360ad6772f76871d9e9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };