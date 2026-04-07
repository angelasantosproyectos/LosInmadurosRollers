# 🛼 RollerMadrid · Web Comunidad

Web SPA de patinaje en línea con Firebase, autenticación, rutas, favoritos y chat en tiempo real.

---

## 🚀 Stack

- HTML + CSS + JS vanilla (ES Modules)
- Firebase v10 (Auth, Firestore)
- Vercel (deploy)

---

## ⚙️ Configuración Firebase

### 1. Crear proyecto Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. **Crear proyecto** → pon un nombre (ej: `rollermadrid`)
3. Desactiva Google Analytics si no lo necesitas → **Crear proyecto**

### 2. Configurar Authentication

1. En tu proyecto → **Authentication** → **Comenzar**
2. Pestaña **Sign-in method** → Activa:
   - ✅ **Correo electrónico/contraseña**
   - ✅ **Google** (necesitarás un nombre de la app y email de soporte)

### 3. Configurar Firestore

1. **Firestore Database** → **Crear base de datos**
2. Selecciona **Modo de producción** → elige región (ej: `europe-west1`)
3. Una vez creada, ve a **Reglas** y pega esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rutas: todos pueden leer, solo autenticados pueden crear
    match /routes/{routeId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;

      // Comentarios
      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
      }
    }

    // Chat: todos pueden leer, solo autenticados pueden escribir
    match /chat/{msgId} {
      allow read: if true;
      allow create: if request.auth != null;
    }

    // Usuarios: solo el propio usuario puede leer/editar su doc
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Crea los **Índices** necesarios (Firestore te pedirá crearlos la primera vez que falten — aparecerá un link en la consola del navegador).

### 4. Obtener la configuración de tu app

1. En Firebase → ⚙️ **Configuración del proyecto** → pestaña **General**
2. Baja hasta **Tus apps** → **Agregar app** → elige el icono **Web** (`</>`)
3. Pon un nombre → **Registrar app**
4. Copia el objeto `firebaseConfig`

### 5. Pegar la config en el proyecto

Abre `js/firebase-config.js` y reemplaza los valores:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 6. Dominio autorizado para Google Auth (para Vercel)

1. Firebase → Authentication → **Sign-in method** → baja a **Dominios autorizados**
2. Añade tu dominio de Vercel: `tu-app.vercel.app`

---

## 📦 Estructura de archivos

```
roller-madrid/
├── index.html              # SPA principal
├── css/
│   └── style.css           # Estilos
├── js/
│   ├── firebase-config.js  # ⚠️ Aquí va tu config Firebase
│   ├── auth.js             # Autenticación
│   ├── router.js           # Navegación SPA
│   ├── routes.js           # CRUD rutas, favoritos, comentarios
│   ├── chat.js             # Chat en tiempo real
│   └── app.js              # Orquestador principal
└── README.md
```

---

## 🌐 Deploy en Vercel

1. Sube el proyecto a GitHub
2. Ve a [vercel.com](https://vercel.com) → **New Project** → importa tu repo
3. Configuración:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (o la carpeta donde esté `index.html`)
   - No necesitas build command
4. **Deploy** → ¡listo!

> ⚠️ Recuerda añadir el dominio `.vercel.app` a los dominios autorizados de Firebase Auth.

---

## 🗂️ Colecciones Firestore

| Colección | Campos principales |
|---|---|
| `routes` | nombre, zona, punto, nivel, fecha, km, descripcion, img, authorId, authorName, favoritedBy[], favorites |
| `routes/{id}/comments` | text, authorId, authorName, createdAt |
| `chat` | text, authorId, authorName, createdAt |
| `users` | name, email, createdAt, favorites[] |

---

## ✨ Funcionalidades

- 🏠 **Home** — Hero animado + preview de próximas rutas + stats
- 🛣️ **Rutas** — Listado con filtros (nivel, zona, búsqueda)
- 📋 **Detalle de ruta** — Info completa + comentarios en tiempo real
- ➕ **Convocar ruta** — Formulario (solo usuarios registrados)
- ❤️ **Favoritos** — Rutas guardadas por el usuario
- 💬 **Comunidad** — Chat general en tiempo real + actividad reciente
- 👤 **Mi perfil** — Stats personales + rutas creadas
- 🔐 **Auth** — Email/contraseña + Google

---

Hecho con 🛼 para la comunidad roller de Madrid.
