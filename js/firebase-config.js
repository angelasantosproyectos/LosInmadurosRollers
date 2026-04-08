// ════════════════════════════════════════════
//  FIREBASE CONFIGURATION · CDN (sin npm)
// ════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkIu_c-7EuvsPt9J0QtCutv_WP5Ttljc0",
  authDomain: "losinmadurosrollers.firebaseapp.com",
  projectId: "losinmadurosrollers",
  storageBucket: "losinmadurosrollers.firebasestorage.app",
  messagingSenderId: "19664212284",
  appId: "1:19664212284:web:6fa94d32474385de8f4e39"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);