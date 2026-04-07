// ════════════════════════════════
//  CHAT MODULE
// ════════════════════════════════
import { db } from "./firebase-config.js";
import {
  collection, addDoc, query, orderBy,
  onSnapshot, limit, serverTimestamp, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { currentUser } from "./auth.js";

let unsubChat = null;

function timeStr(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function initChat(user) {
  const messagesEl = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const chatAuthGate = document.getElementById("chatAuthGate");
  const chatInput = document.getElementById("chatInput");
  const chatSend = document.getElementById("chatSend");
  const chatLoginBtn = document.getElementById("chatLoginBtn");

  // Show/hide input
  if (user) {
    chatAuthGate.classList.add("hidden");
    chatForm.classList.remove("hidden");
  } else {
    chatAuthGate.classList.remove("hidden");
    chatForm.classList.add("hidden");
  }

  chatLoginBtn?.addEventListener("click", () => window.openAuthModal());

  // Unsubscribe previous
  if (unsubChat) { unsubChat(); unsubChat = null; }

  // Listen messages
  const q = query(
    collection(db, "chat"),
    orderBy("createdAt", "desc"),
    limit(60)
  );

  unsubChat = onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
    messagesEl.innerHTML = "";
    if (!msgs.length) {
      messagesEl.innerHTML = `<p class="chat-loading">Sé el primero en escribir 👋</p>`;
      return;
    }
    msgs.forEach(msg => {
      const isOwn = user && msg.authorId === user.uid;
      const el = document.createElement("div");
      el.className = `chat-msg ${isOwn ? "own" : ""}`;
      el.innerHTML = `
        ${!isOwn ? `<div class="chat-msg-author">${msg.authorName}</div>` : ""}
        <div>${msg.text}</div>
        <div class="chat-msg-time">${timeStr(msg.createdAt)}</div>
      `;
      messagesEl.appendChild(el);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });

  // Send
  const sendMsg = async () => {
    const text = chatInput.value.trim();
    if (!text || !user) return;
    chatInput.value = "";
    chatSend.disabled = true;
    try {
      await addDoc(collection(db, "chat"), {
        text,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        createdAt: serverTimestamp()
      });
    } finally {
      chatSend.disabled = false;
      chatInput.focus();
    }
  };

  chatSend?.addEventListener("click", sendMsg);
  chatInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMsg(); });
}

// ── ACTIVITY FEED (recent route events) ──
export async function loadActivityFeed() {
  const feed = document.getElementById("activityFeed");
  try {
    const { collection: col, query: q2, orderBy: ob, limit: lim, getDocs: gd } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    const snap = await getDocs(
      query(collection(db, "routes"), orderBy("createdAt", "desc"), limit(8))
    );
    feed.innerHTML = "";
    if (snap.empty) { feed.innerHTML = `<p class="chat-loading">Sin actividad reciente</p>`; return; }
    snap.docs.forEach((d, i) => {
      const r = d.data();
      const el = document.createElement("div");
      el.className = "activity-item";
      el.style.animationDelay = `${i * 0.05}s`;
      el.innerHTML = `
        <span class="activity-icon">🛼</span>
        <span class="activity-text">
          <strong>${r.authorName || "Alguien"}</strong> convocó
          <strong>${r.nombre}</strong>
        </span>
      `;
      feed.appendChild(el);
    });
  } catch (e) {
    feed.innerHTML = `<p class="chat-loading">Error al cargar</p>`;
  }
}
