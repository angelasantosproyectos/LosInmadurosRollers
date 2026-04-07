// ════════════════════════════════
//  AUTH MODULE
// ════════════════════════════════
import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { db } from "./firebase-config.js";
import { doc, setDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const provider = new GoogleAuthProvider();

export let currentUser = null;

// ── Auth state observer ──
export function initAuth(onUserChange) {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    onUserChange(user);
    if (user) {
      // Ensure user doc exists
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          name: user.displayName || user.email.split("@")[0],
          email: user.email,
          createdAt: serverTimestamp(),
          favorites: []
        });
      }
    }
  });
}

// ── Register ──
export async function register(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    email,
    createdAt: serverTimestamp(),
    favorites: []
  });
  return cred.user;
}

// ── Login ──
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ── Google ──
export async function loginGoogle() {
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

// ── Logout ──
export async function logout() {
  await signOut(auth);
}

// ── Error messages in Spanish ──
export function authError(code) {
  const msgs = {
    "auth/email-already-in-use": "Ya existe una cuenta con ese email.",
    "auth/invalid-email": "Email no válido.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/user-not-found": "No existe cuenta con ese email.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/popup-closed-by-user": "Se cerró la ventana de Google.",
    "auth/invalid-credential": "Email o contraseña incorrectos."
  };
  return msgs[code] || "Error al iniciar sesión. Inténtalo de nuevo.";
}
