// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyAQFkWeSX2XWPkkpz_a016jQfJaYoO8r3o",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "blockcred-4dbc6.firebaseapp.com",
  projectId:
    process.env.REACT_APP_FIREBASE_PROJECT_ID || "blockcred-4dbc6",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "blockcred-4dbc6.firebasestorage.app",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "681274244940",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:681274244940:web:95c360ad6772f76871d9e9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
