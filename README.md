# 🛼 RollerMadrid · Guía de configuración Firebase

---

## ❗ Problema que tenías (ya corregido)

El archivo `js/firebase-config.js` tenía **imports duplicados y mezclados** — usaba a la vez el formato NPM (`import from "firebase/app"`) y el formato CDN (`import from "https://..."`). Eso hace que el navegador falle silenciosamente y no se pueda autenticar ni leer Firestore.

**Ya está corregido.** Solo queda hacer los pasos de Firebase Console.

---

## ✅ Pasos que DEBES hacer en Firebase Console

### PASO 1 — Activar Authentication

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Selecciona tu proyecto `losinmadurosrollers`
3. Menú izquierdo → **Authentication** → **Comenzar** (si no está activo)
4. Pestaña **Sign-in method**
5. Activa **Correo electrónico/contraseña** → guarda
6. Activa **Google** → pon tu email de soporte → guarda

---

### PASO 2 — Crear la base de datos Firestore

1. Menú izquierdo → **Firestore Database** → **Crear base de datos**
2. Elige **Empezar en modo de producción**
3. Selecciona región: `europe-west1` (la más cercana a Madrid)
4. Espera a que se cree

---

### PASO 3 — Pegar las Reglas de Firestore

1. En Firestore → pestaña **Reglas**
2. Borra todo lo que hay y pega esto exactamente:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /routes/{routeId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null
                    && request.auth.uid == resource.data.authorId;

      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
      }
    }

    match /chat/{msgId} {
      allow read: if true;
      allow create: if request.auth != null;
    }

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.uid == userId;
    }
  }
}
```

3. Pulsa **Publicar**

---

### PASO 4 — Crear los Índices de Firestore

La primera vez que uses los filtros o el chat, Firestore pedirá crear índices. Verás el error en la **consola del navegador** (F12 → Console) con un link directo para crearlos. Solo tienes que clicar ese link y aceptar.

Los índices que necesitas son:

| Colección | Campos | Orden |
|---|---|---|
| `routes` | `createdAt` | Descendente |
| `routes` | `authorId`, `createdAt` | Descendente |
| `routes` | `favoritedBy` (array), `createdAt` | Descendente |
| `chat` | `createdAt` | Descendente |

---

### PASO 5 — Añadir dominios autorizados (para Google login en producción)

1. Firebase → Authentication → **Sign-in method** → baja al final
2. **Dominios autorizados** → **Añadir dominio**
3. Añade: `tu-app.vercel.app` (el dominio que te dé Vercel al publicar)
4. Si usas dominio propio, añádelo también

> ⚠️ Sin este paso, el login con Google falla en producción.

---

## 📦 Estructura del proyecto

```
LosInmadurosRollers/
├── index.html               # App principal (SPA)
├── vercel.json              # Configuración Vercel (routing)
├── css/
│   └── style.css
├── js/
│   ├── firebase-config.js   ← Ya tiene tus credenciales (corregido)
│   ├── auth.js              ← Login, registro, Google
│   ├── router.js            ← Navegación SPA
│   ├── routes.js            ← CRUD rutas, favoritos, comentarios
│   ├── chat.js              ← Chat en tiempo real
│   └── app.js               ← Orquestador principal
└── README.md
```

---

## 🌐 Deploy en Vercel

1. Sube la carpeta a GitHub
2. Ve a [vercel.com](https://vercel.com) → **New Project** → importa el repo
3. Configuración:
   - **Framework Preset**: Other
   - **Root Directory**: la carpeta donde está `index.html`
   - **Build Command**: dejar vacío
   - **Output Directory**: dejar vacío
4. **Deploy**

---

## ✨ Funcionalidades

| Página | Descripción |
|---|---|
| 🏠 Home | Hero animado + próximas rutas |
| 🛣️ Rutas | Listado con filtros de nivel y zona |
| 📋 Detalle | Info de ruta + comentarios en tiempo real |
| ➕ Convocar | Formulario para crear rutas (requiere login) |
| ❤️ Favoritos | Rutas guardadas por el usuario |
| 💬 Comunidad | Chat en tiempo real + actividad |
| 👤 Mi perfil | Estadísticas y rutas propias |

Hecho con 🛼 para Los Inmaduros Rollers Madrid.
