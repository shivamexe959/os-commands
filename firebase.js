import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// TODO: Replace with your Firebase Project Configuration
// Follow the Firebase Setup Instructions generated in the artifacts to get these values
const firebaseConfig = {
  apiKey: "AIzaSyCj7PDojhDso9cUOhmjCvEU_M63PQaMsLk",
  authDomain: "ada-algorithm-lab.firebaseapp.com",
  projectId: "ada-algorithm-lab",
  storageBucket: "ada-algorithm-lab.firebasestorage.app",
  messagingSenderId: "623367680318",
  appId: "1:623367680318:web:4937eb1f57ea1e403d3c6f",
  measurementId: "G-KF412TJNHM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
