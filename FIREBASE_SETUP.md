# Configuración de Firebase para Shift App

## Pasos para configurar Firebase

### 1. Crear proyecto en Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Configura el nombre del proyecto como "shift-app" o similar

### 2. Configurar Authentication
1. En Firebase Console, ve a "Authentication" → "Sign-in method"
2. Habilita "Email/Password"
3. Guarda los cambios

### 3. Configurar Realtime Database
1. Ve a "Realtime Database" en el menú izquierdo
2. Crea una nueva base de datos
3. Selecciona "Start in test mode" (para desarrollo)
4. Configura las reglas de seguridad según sea necesario

### 4. Obtener credenciales
1. Ve a "Project settings" (ícono de engranaje)
2. En la sección "General", busca "Your apps"
3. Si no hay una app web, haz clic en "Add app" → "Web"
4. Registra la app y copia las credenciales

### 5. Actualizar archivo de configuración
Reemplaza las credenciales en `config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  databaseURL: "TU_DATABASE_URL",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

### 6. Reglas de seguridad para Realtime Database
Para desarrollo, puedes usar estas reglas en Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "carts": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "favorites": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "orders": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "products": {
      ".read": true,
      ".write": "auth !== null"
    }
  }
}
```

## Estructura de datos en Realtime Database

```
shift-app-default-rtdb/
├── users/
│   ├── {userId}/
│   │   ├── uid
│   │   ├── email
│   │   ├── name
│   │   ├── avatar
│   │   ├── phone
│   │   └── createdAt
├── carts/
│   ├── {userId}/
│   │   ├── {productId}/
│   │   │   ├── id
│   │   │   ├── name
│   │   │   ├── price
│   │   │   ├── quantity
│   │   │   └── addedAt
├── favorites/
│   ├── {userId}/
│   │   ├── {productId}/
│   │   │   ├── id
│   │   │   ├── name
│   │   │   ├── price
│   │   │   └── addedAt
├── orders/
│   ├── {userId}/
│   │   ├── {orderId}/
│   │   │   ├── id
│   │   │   ├── items
│   │   │   ├── total
│   │   │   ├── status
│   │   │   └── createdAt
└── products/
    ├── {productId}/
    │   ├── id
    │   ├── name
    │   ├── price
    │   ├── description
    │   ├── image
    │   └── createdAt
```

## Funcionalidades implementadas

### Authentication
- ✅ Registro de usuarios con email/password
- ✅ Inicio de sesión
- ✅ Cierre de sesión
- ✅ Manejo de errores específicos
- ✅ Persistencia de sesión

### Realtime Database
- ✅ Servicio de usuarios (`userService`)
- ✅ Servicio de productos (`productService`)
- ✅ Servicio de carrito (`cartService`)
- ✅ Servicio de favoritos (`favoritesService`)
- ✅ Servicio de pedidos (`orderService`)

### Integración con la app
- ✅ Hook `useAuth` para manejar estado de autenticación
- ✅ Actualización de pantallas de login y registro
- ✅ Actualización de perfil para usar Firebase
- ✅ Navegación automática según estado de autenticación

## Próximos pasos
1. Configurar las credenciales reales de Firebase
2. Ajustar las reglas de seguridad para producción
3. Implementar carga de imágenes a Firebase Storage
4. Agregar más métodos de autenticación (Google, Facebook, etc.)
5. Implementar notificaciones push

## Notas importantes
- La app ahora usa Firebase Authentication en lugar de AsyncStorage
- Los datos se sincronizan en tiempo real con Realtime Database
- Las reglas de seguridad aseguran que cada usuario solo pueda acceder a sus propios datos
- La configuración actual está en modo de prueba, adecuada para desarrollo
