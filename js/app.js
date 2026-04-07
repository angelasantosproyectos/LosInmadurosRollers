// ════════════════════════════════
//  APP.JS · Main orchestrator
// ════════════════════════════════
import { initAuth, register, login, loginGoogle, logout, authError, currentUser as _cu } from "./auth.js";
import { initRouter, navigate, onNavigate } from "./router.js";
import { loadRoutesPage, loadHomePreview, loadFavoritesPage, loadProfilePage, createRoute } from "./routes.js";
import { initChat, loadActivityFeed } from "./chat.js";

// ════ TOAST ════
export function showToast(msg, type = "success") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 3200);
}
window.showToast = showToast;

// ════ AUTH MODAL ════
const modal = document.getElementById("authModal");
const modalClose = document.getElementById("modalClose");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const formLogin = document.getElementById("formLogin");
const formRegister = document.getElementById("formRegister");
const loginError = document.getElementById("loginError");
const regError = document.getElementById("regError");

function openModal(tab = "login") {
  modal.classList.remove("hidden");
  switchTab(tab);
}
function closeModal() { modal.classList.add("hidden"); }
window.openAuthModal = () => openModal("login");

function switchTab(tab) {
  const isLogin = tab === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  formLogin.classList.toggle("hidden", !isLogin);
  formRegister.classList.toggle("hidden", isLogin);
  loginError.classList.add("hidden");
  regError.classList.add("hidden");
}

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
tabLogin.addEventListener("click", () => switchTab("login"));
tabRegister.addEventListener("click", () => switchTab("register"));
document.getElementById("btnLogin").addEventListener("click", () => openModal("login"));
document.getElementById("btnRegister").addEventListener("click", () => openModal("register"));
document.getElementById("crearLoginBtn")?.addEventListener("click", () => openModal("login"));
document.getElementById("favLoginBtn")?.addEventListener("click", () => openModal("login"));

// ── Login form ──
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPass").value;
  loginError.classList.add("hidden");
  try {
    await login(email, pass);
    closeModal();
    showToast("✅ Sesión iniciada", "success");
  } catch (err) {
    loginError.textContent = authError(err.code);
    loginError.classList.remove("hidden");
  }
});

// ── Register form ──
formRegister.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const pass = document.getElementById("regPass").value;
  regError.classList.add("hidden");
  try {
    await register(name, email, pass);
    closeModal();
    showToast("🎉 ¡Bienvenid@ a la comunidad!", "success");
  } catch (err) {
    regError.textContent = authError(err.code);
    regError.classList.remove("hidden");
  }
});

// ── Google ──
[document.getElementById("btnGoogle"), document.getElementById("btnGoogleReg")].forEach(btn => {
  btn?.addEventListener("click", async () => {
    try {
      await loginGoogle();
      closeModal();
      showToast("✅ Sesión iniciada con Google", "success");
    } catch (err) {
      showToast(authError(err.code), "error");
    }
  });
});

// ── Logout ──
document.getElementById("btnLogout").addEventListener("click", async () => {
  await logout();
  navigate("home");
  showToast("Sesión cerrada", "success");
});

// ════ USER MENU ════
const userMenu = document.getElementById("userMenu");
const authBtns = document.getElementById("authBtns");
const userAvatar = document.getElementById("userAvatar");
const userDropdown = document.getElementById("userDropdown");
const userName = document.getElementById("userName");
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

userAvatar.addEventListener("click", () => {
  userDropdown.classList.toggle("open");
});
document.addEventListener("click", (e) => {
  if (!userMenu.contains(e.target)) userDropdown.classList.remove("open");
});

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  navLinks.classList.toggle("open");
});

// Close mobile nav on link click
navLinks.addEventListener("click", () => {
  hamburger.classList.remove("open");
  navLinks.classList.remove("open");
});

// ── Navbar scroll ──
window.addEventListener("scroll", () => {
  document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 10);
});

// ════ AUTH STATE ════
let currentUser = null;

function updateUI(user) {
  currentUser = user;
  if (user) {
    authBtns.classList.add("hidden");
    userMenu.classList.remove("hidden");
    userAvatar.textContent = (user.displayName || user.email)[0].toUpperCase();
    userName.textContent = user.displayName || user.email;

    // Crear page: show form
    document.getElementById("crearAuthGate")?.classList.add("hidden");
    document.getElementById("crearForm")?.classList.remove("hidden");
  } else {
    authBtns.classList.remove("hidden");
    userMenu.classList.add("hidden");

    // Crear page: show gate
    document.getElementById("crearAuthGate")?.classList.remove("hidden");
    document.getElementById("crearForm")?.classList.add("hidden");
  }
}

// ════ CREAR RUTA FORM ════
document.getElementById("crearForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) { openModal(); return; }

  const btn = document.getElementById("crearSubmitBtn");
  btn.disabled = true;
  btn.textContent = "Publicando...";

  const fecha = document.getElementById("rutaFecha").value;
  try {
    await createRoute({
      nombre: document.getElementById("rutaNombre").value,
      zona: document.getElementById("rutaZona").value,
      punto: document.getElementById("rutaPunto").value,
      nivel: document.getElementById("rutaNivel").value,
      fecha: fecha ? new Date(fecha) : null,
      km: document.getElementById("rutaKm").value || null,
      descripcion: document.getElementById("rutaDesc").value,
      img: document.getElementById("rutaImg").value || null
    }, currentUser);
    showToast("🛼 ¡Ruta publicada!", "success");
    document.getElementById("crearForm").reset();
    navigate("rutas");
  } catch (err) {
    console.error(err);
    showToast("Error al publicar la ruta", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "🛼 Publicar ruta";
  }
});

// ════ ROUTER CALLBACKS ════
onNavigate(async (page) => {
  switch (page) {
    case "home":
      await loadHomePreview(currentUser);
      animateStats();
      break;
    case "rutas":
      await loadRoutesPage(currentUser);
      break;
    case "favoritos":
      await loadFavoritesPage(currentUser);
      break;
    case "comunidad":
      initChat(currentUser);
      await loadActivityFeed();
      break;
    case "miperfil":
      if (!currentUser) { navigate("home"); return; }
      await loadProfilePage(currentUser);
      break;
  }
});

// ════ STATS COUNTER ════
function animateStats() {
  const els = [
    { el: document.getElementById("statRoutes"), to: parseInt(document.getElementById("statRoutes").textContent) || 0 },
    { el: document.getElementById("statUsers"), to: 42 }
  ];
  els.forEach(({ el, to }) => {
    let n = 0;
    const step = Math.max(1, Math.ceil(to / 30));
    const int = setInterval(() => {
      n = Math.min(n + step, to);
      el.textContent = n;
      if (n >= to) clearInterval(int);
    }, 40);
  });
}

// ════ INIT ════
initRouter();
initAuth((user) => {
  updateUI(user);
  // Re-render current page on auth change
  const activePage = document.querySelector(".page.active")?.id?.replace("page-", "");
  if (activePage) {
    switch (activePage) {
      case "home": loadHomePreview(user); break;
      case "rutas": loadRoutesPage(user); break;
      case "favoritos": loadFavoritesPage(user); break;
      case "comunidad": initChat(user); break;
      case "miperfil": if (user) loadProfilePage(user); else navigate("home"); break;
    }
  }
});

// Load home on start
loadHomePreview(null);
animateStats();
