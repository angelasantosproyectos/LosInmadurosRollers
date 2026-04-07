// ════════════════════════════════
//  ROUTES MODULE
// ════════════════════════════════
import { db } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, getDoc, doc,
  query, orderBy, serverTimestamp, updateDoc,
  arrayUnion, arrayRemove, onSnapshot, limit,
  where, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { currentUser } from "./auth.js";
import { navigate } from "./router.js";
import { showToast } from "./app.js";

const ROUTE_IMAGES = [
  "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80",
  "https://images.unsplash.com/photo-1560448075-a185e5d6c6e3?w=600&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
];

// ── HELPERS ──
function levelBadge(level) {
  const map = { "fácil": "badge-fácil", "medio": "badge-medio", "difícil": "badge-difícil" };
  return map[level] || "";
}
function levelEmoji(level) {
  return { "fácil": "🟢", "medio": "🟡", "difícil": "🔴" }[level] || "⚪";
}
function formatDate(ts) {
  if (!ts) return "–";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("es-ES", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit"
  });
}
function timeAgo(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return formatDate(ts);
}

// ── CREATE ROUTE ──
export async function createRoute(data, user) {
  const ref = await addDoc(collection(db, "routes"), {
    ...data,
    authorId: user.uid,
    authorName: user.displayName || user.email,
    createdAt: serverTimestamp(),
    favorites: 0,
    favoritedBy: []
  });
  return ref.id;
}

// ── GET ALL ROUTES ──
export async function getRoutes() {
  const q = query(collection(db, "routes"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── GET ROUTE ──
export async function getRoute(id) {
  const snap = await getDoc(doc(db, "routes", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ── TOGGLE FAVORITE ──
export async function toggleFavorite(routeId, user) {
  const routeRef = doc(db, "routes", routeId);
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(routeRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const already = (data.favoritedBy || []).includes(user.uid);
  if (already) {
    await updateDoc(routeRef, { favoritedBy: arrayRemove(user.uid), favorites: Math.max(0, (data.favorites || 0) - 1) });
    await updateDoc(userRef, { favorites: arrayRemove(routeId) });
    return false;
  } else {
    await updateDoc(routeRef, { favoritedBy: arrayUnion(user.uid), favorites: (data.favorites || 0) + 1 });
    await updateDoc(userRef, { favorites: arrayUnion(routeId) });
    return true;
  }
}

// ── GET USER FAVORITES ──
export async function getUserFavorites(userId) {
  const q = query(collection(db, "routes"), where("favoritedBy", "array-contains", userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── GET USER ROUTES ──
export async function getUserRoutes(userId) {
  const q = query(collection(db, "routes"), where("authorId", "==", userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── ADD COMMENT ──
export async function addComment(routeId, text, user) {
  await addDoc(collection(db, "routes", routeId, "comments"), {
    text,
    authorId: user.uid,
    authorName: user.displayName || user.email,
    createdAt: serverTimestamp()
  });
}

// ── LISTEN COMMENTS ──
export function listenComments(routeId, callback) {
  const q = query(
    collection(db, "routes", routeId, "comments"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── RENDER ROUTE CARD ──
export function renderCard(route, user, onFavClick) {
  const isFav = user && (route.favoritedBy || []).includes(user.uid);
  const img = route.img || "";
  const div = document.createElement("div");
  div.className = "route-card";
  div.innerHTML = `
    <div class="card-img">
      ${img
        ? `<img src="${img}" alt="${route.nombre}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=card-img-placeholder>🛼</div>'"/>`
        : `<div class="card-img-placeholder">🛼</div>`}
      <span class="card-badge ${levelBadge(route.nivel)}">${levelEmoji(route.nivel)} ${route.nivel || "–"}</span>
    </div>
    <div class="card-body">
      <div class="card-title">${route.nombre}</div>
      <div class="card-meta">
        <span>📍 ${route.zona || "–"}</span>
        <span>🗓️ ${formatDate(route.fecha)}</span>
        ${route.km ? `<span>📏 ${route.km}km</span>` : ""}
        <span>📌 ${route.punto || "–"}</span>
      </div>
      <div class="card-footer">
        <span class="card-author">Por ${route.authorName || "Anónimo"}</span>
        <div class="card-actions">
          <button class="btn-fav ${isFav ? "active" : ""}" title="${isFav ? "Quitar favorito" : "Guardar"}">
            ${isFav ? "❤️" : "🤍"}
          </button>
          <button class="btn-detail">Ver →</button>
        </div>
      </div>
    </div>
  `;

  div.querySelector(".btn-fav").addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!user) { window.openAuthModal(); return; }
    await onFavClick(route.id);
  });

  div.querySelector(".btn-detail").addEventListener("click", (e) => {
    e.stopPropagation();
    loadDetalleRoute(route.id);
  });

  div.addEventListener("click", () => loadDetalleRoute(route.id));
  return div;
}

// ── LOAD ROUTES PAGE ──
let allRoutes = [];
let unsubComments = null;

export async function loadRoutesPage(user) {
  const list = document.getElementById("routesList");
  list.innerHTML = `<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>`;
  allRoutes = await getRoutes();
  renderRoutesList(allRoutes, user);

  // Filters
  const searchEl = document.getElementById("searchRoutes");
  const levelEl = document.getElementById("filterLevel");
  const zoneEl = document.getElementById("filterZone");

  const filter = () => {
    const s = searchEl.value.toLowerCase();
    const l = levelEl.value;
    const z = zoneEl.value;
    const filtered = allRoutes.filter(r => {
      const matchS = !s || r.nombre?.toLowerCase().includes(s) || r.zona?.toLowerCase().includes(s);
      const matchL = !l || r.nivel === l;
      const matchZ = !z || r.zona === z;
      return matchS && matchL && matchZ;
    });
    renderRoutesList(filtered, user);
  };

  searchEl.addEventListener("input", filter);
  levelEl.addEventListener("change", filter);
  zoneEl.addEventListener("change", filter);

  // Stats counter home
  document.getElementById("statRoutes").textContent = allRoutes.length;
}

function renderRoutesList(routes, user) {
  const list = document.getElementById("routesList");
  const empty = document.getElementById("emptyRoutes");
  list.innerHTML = "";
  if (!routes.length) { empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");
  routes.forEach((r, i) => {
    const card = renderCard(r, user, (id) => handleFav(id, user));
    card.style.animationDelay = `${i * 0.06}s`;
    list.appendChild(card);
  });
}

// ── LOAD HOME PREVIEW ──
export async function loadHomePreview(user) {
  const q = query(collection(db, "routes"), orderBy("createdAt", "desc"), limit(3));
  const snap = await getDocs(q);
  const routes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const list = document.getElementById("homeRoutesList");
  list.innerHTML = "";
  if (!routes.length) {
    list.innerHTML = `<p class="empty-msg" style="grid-column:1/-1">Aún no hay rutas. ¡Sé el primero en convocar una!</p>`;
    return;
  }
  routes.forEach((r, i) => {
    const card = renderCard(r, user, (id) => handleFav(id, user));
    card.style.animationDelay = `${i * 0.08}s`;
    list.appendChild(card);
  });
  document.getElementById("statRoutes").textContent = allRoutes.length || routes.length;
}

// ── HANDLE FAV ──
async function handleFav(routeId, user) {
  if (!user) { window.openAuthModal(); return; }
  const added = await toggleFavorite(routeId, user);
  showToast(added ? "❤️ Añadido a favoritos" : "Eliminado de favoritos", "success");
  // Refresh current list view
  allRoutes = await getRoutes();
  renderRoutesList(allRoutes, user);
}

// ── LOAD DETALLE ──
export async function loadDetalleRoute(id) {
  const { navigate } = await import("./router.js");
  navigate("detalle");

  const wrap = document.getElementById("detalleContent");
  wrap.innerHTML = `<div style="text-align:center;padding:4rem;color:var(--text2)">Cargando...</div>`;

  if (unsubComments) { unsubComments(); unsubComments = null; }

  const route = await getRoute(id);
  if (!route) { wrap.innerHTML = `<p>Ruta no encontrada.</p>`; return; }

  const { currentUser } = await import("./auth.js");
  const isFav = currentUser && (route.favoritedBy || []).includes(currentUser.uid);

  wrap.innerHTML = `
    <button class="btn-back" id="backBtn">← Volver a rutas</button>
    <div class="detalle-header">
      ${route.img
        ? `<img src="${route.img}" class="detalle-img" alt="${route.nombre}" onerror="this.style.display='none'"/>`
        : `<div class="detalle-img" style="display:flex;align-items:center;justify-content:center;font-size:5rem;background:var(--surface)">🛼</div>`}
      <h1 class="detalle-title">${route.nombre}</h1>
      <div class="detalle-meta">
        <span>📍 ${route.zona}</span>
        <span>🗓️ ${formatDate(route.fecha)}</span>
        <span>🎯 ${levelEmoji(route.nivel)} ${route.nivel}</span>
        ${route.km ? `<span>📏 ${route.km}km</span>` : ""}
        <span>📌 ${route.punto}</span>
        <span>👤 ${route.authorName}</span>
      </div>
      <p class="detalle-desc">${route.descripcion || "Sin descripción."}</p>
      <div class="detalle-actions">
        <button class="btn-primary btn-fav-detalle ${isFav ? "btn-fav-active" : ""}" id="detalleFavBtn">
          ${isFav ? "❤️ En favoritos" : "🤍 Guardar"}
        </button>
      </div>
    </div>
    <div class="comments-section">
      <h3>💬 Comentarios</h3>
      <div id="commentInputArea">
        ${currentUser
          ? `<div class="comment-input-wrap">
               <input type="text" id="commentInput" placeholder="Escribe un comentario..." maxlength="300"/>
               <button class="btn-primary" id="commentSend">Enviar</button>
             </div>`
          : `<p style="color:var(--text2);font-size:.875rem;margin-bottom:1rem">
               <a href="#" id="commentLoginBtn" style="color:var(--primary)">Inicia sesión</a> para comentar.
             </p>`}
      </div>
      <div class="comment-list" id="commentList">
        <p style="color:var(--text3);font-size:.85rem">Cargando comentarios...</p>
      </div>
    </div>
  `;

  wrap.querySelector("#backBtn").addEventListener("click", () => navigate("rutas"));

  // Fav button
  const favBtn = wrap.querySelector("#detalleFavBtn");
  if (favBtn) {
    favBtn.addEventListener("click", async () => {
      if (!currentUser) { window.openAuthModal(); return; }
      const added = await toggleFavorite(id, currentUser);
      favBtn.textContent = added ? "❤️ En favoritos" : "🤍 Guardar";
      showToast(added ? "❤️ Añadido a favoritos" : "Eliminado de favoritos", "success");
    });
  }

  // Comment login btn
  const clb = wrap.querySelector("#commentLoginBtn");
  if (clb) clb.addEventListener("click", (e) => { e.preventDefault(); window.openAuthModal(); });

  // Send comment
  const sendBtn = wrap.querySelector("#commentSend");
  const inputEl = wrap.querySelector("#commentInput");
  if (sendBtn && inputEl) {
    sendBtn.addEventListener("click", async () => {
      const text = inputEl.value.trim();
      if (!text || !currentUser) return;
      sendBtn.disabled = true;
      await addComment(id, text, currentUser);
      inputEl.value = "";
      sendBtn.disabled = false;
    });
    inputEl.addEventListener("keydown", (e) => { if (e.key === "Enter") sendBtn.click(); });
  }

  // Listen comments
  const commentList = wrap.querySelector("#commentList");
  unsubComments = listenComments(id, (comments) => {
    if (!comments.length) {
      commentList.innerHTML = `<p style="color:var(--text3);font-size:.85rem;padding:.5rem 0">Sin comentarios aún. ¡Sé el primero!</p>`;
      return;
    }
    commentList.innerHTML = "";
    comments.forEach((c, i) => {
      const el = document.createElement("div");
      el.className = "comment-item";
      el.style.animationDelay = `${i * 0.04}s`;
      el.innerHTML = `
        <div class="comment-author">${c.authorName}</div>
        <div class="comment-text">${c.text}</div>
        <div class="comment-time">${timeAgo(c.createdAt)}</div>
      `;
      commentList.appendChild(el);
    });
  });
}

// ── LOAD FAVORITES PAGE ──
export async function loadFavoritesPage(user) {
  const gate = document.getElementById("favAuthGate");
  const list = document.getElementById("favList");
  const empty = document.getElementById("emptyFavs");

  if (!user) {
    gate.classList.remove("hidden");
    list.classList.add("hidden");
    empty.classList.add("hidden");
    return;
  }
  gate.classList.add("hidden");
  list.classList.remove("hidden");
  list.innerHTML = `<div class="skeleton-card"></div><div class="skeleton-card"></div>`;

  const favs = await getUserFavorites(user.uid);
  list.innerHTML = "";
  if (!favs.length) { empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");
  favs.forEach((r, i) => {
    const card = renderCard(r, user, async (id) => {
      await toggleFavorite(id, user);
      showToast("Eliminado de favoritos", "success");
      loadFavoritesPage(user);
    });
    card.style.animationDelay = `${i * 0.06}s`;
    list.appendChild(card);
  });
}

// ── LOAD PROFILE PAGE ──
export async function loadProfilePage(user) {
  if (!user) return;
  document.getElementById("profileAvatarBig").textContent = (user.displayName || user.email)[0].toUpperCase();
  document.getElementById("profileName").textContent = user.displayName || "Sin nombre";
  document.getElementById("profileEmail").textContent = user.email;
  document.getElementById("profileJoined").textContent = `Miembro desde ${new Date(user.metadata.creationTime).toLocaleDateString("es-ES", { year: "numeric", month: "long" })}`;

  const myRoutes = await getUserRoutes(user.uid);
  document.getElementById("pStatRoutes").textContent = myRoutes.length;

  const userData = await getDoc(doc(db, "users", user.uid));
  const favCount = (userData.data()?.favorites || []).length;
  document.getElementById("pStatFavs").textContent = favCount;

  const myList = document.getElementById("myRoutesList");
  myList.innerHTML = "";
  if (!myRoutes.length) {
    myList.innerHTML = `<p class="empty-msg">Aún no has creado rutas</p>`;
    return;
  }
  myRoutes.forEach((r, i) => {
    const card = renderCard(r, user, (id) => handleFav(id, user));
    card.style.animationDelay = `${i * 0.06}s`;
    myList.appendChild(card);
  });
}
