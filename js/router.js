// ════════════════════════════════
//  ROUTER MODULE
// ════════════════════════════════

const pages = [
  "home", "rutas", "detalle", "crear",
  "favoritos", "comunidad", "miperfil"
];

let currentPage = "home";
let onNavigateCallback = null;

export function navigate(pageId, data = null) {
  // Hide all
  pages.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.classList.remove("active");
  });

  // Show target
  const target = document.getElementById(`page-${pageId}`);
  if (!target) return;
  target.classList.add("active");
  currentPage = pageId;

  // Update nav links
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Callback
  if (onNavigateCallback) onNavigateCallback(pageId, data);
}

export function getCurrentPage() { return currentPage; }

export function onNavigate(cb) { onNavigateCallback = cb; }

export function initRouter() {
  // Delegate clicks on [data-page]
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-page]");
    if (!el) return;
    e.preventDefault();
    const page = el.dataset.page;
    if (page) navigate(page);
  });
}
