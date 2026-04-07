// ════════════════════════════════════════════
//  FIREBASE CONFIGURATION
//  ➜ Reemplaza los valores con tu proyecto Firebase
//  ➜ Ve a: console.firebase.google.com
//    → Tu proyecto → Configuración → Aplicaciones web
// ════════════════════════════════════════════

// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAkIu_c-7EuvsPt9J0QtCutv_WP5Ttljc0",
  authDomain: "losinmadurosrollers.firebaseapp.com",
  projectId: "losinmadurosrollers",
  storageBucket: "losinmadurosrollers.firebasestorage.app",
  messagingSenderId: "19664212284",
  appId: "1:19664212284:web:6fa94d32474385de8f4e39",
  measurementId: "G-T8D73XT8HG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Initialize Firebase
const analytics = getAnalytics(app);




// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional