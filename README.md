# SHIFT - App (Entrega final)

Aplicación móvil desarrollada con **React Native + Expo Router** orientada a e-commerce.
Incluye catálogo con datos mock, carrito de compras, favoritos, perfil, notificaciones, gestión de direcciones y flujo de pedidos con seguimiento.

## Demo de funcionalidades

- **Home / Catálogo**
  - Listado de productos (mock) con navegación a detalle
  - Accesos rápidos a pantallas auxiliares (tiendas, ofertas, etc.)
- **Carrito**
  - Botón central tipo FAB en el tab bar
  - Badge con cantidad de ítems
  - UI tipo marketplace (cards, cantidad, envío, resumen inferior fijo)
- **Checkout**
  - Usa dirección predeterminada desde Firebase
  - Bloquea compra si no hay dirección
  - Crea pedido y navega a seguimiento
- **Pedidos**
  - “Mis pedidos” se actualiza en vivo (polling mientras la pantalla está activa)
  - Seguimiento con estados (Preparando → Despachado → En camino → En la puerta → Entregado)
- **Notificaciones**
  - Feed in-app (persistido)
  - Notificaciones automáticas por cambios de estado
  - Al entregarse el pedido, notificación extra para calificar
- **Calificación**
  - Pantalla de estrellas (1 a 5)
  - Guarda rating en Firebase
  - Pantalla final de agradecimiento
- **Perfil / Cuenta**
  - Edición de datos de usuario y avatar
  - Gestión de direcciones (alta/edición/eliminación y dirección predeterminada)
  - Acceso a “Mis pedidos”
  - “Mis publicaciones” (creación y listado de artículos)
- **Métodos de pago**
  - Alta y listado de tarjetas (UI con tarjeta estilizada)
  - Detección de marca (Visa / Mastercard / American Express) para mostrar logo y estilo
  - Persistencia local con AsyncStorage

## Stack / Tecnologías

- **Expo + React Native**
- **Expo Router** (ruteo file-based)
- **Redux Toolkit** + `react-redux`
  - Estado global: carrito, favoritos, auth, notificaciones
  - Persistencia local (AsyncStorage) para carrito/favoritos/notificaciones
- **Firebase**
  - Auth
  - Realtime Database (direcciones y ratings)
- **SQLite (expo-sqlite)**
  - Cache/persistencia offline del catálogo de productos
  - Base local para entidades (users/addresses/products/cart/favorites/orders)
- **AsyncStorage**
  - Persistencia de pedidos (mock), carrito, favoritos y notificaciones

## Requisitos

- Node.js LTS (recomendado)
- npm
- Expo Go (para correr rápido) o emulador/dispositivo

## Instalación

```bash
npm install
```

## Ejecutar

```bash
npx expo start
```

Opciones comunes:

- Android Emulator
- Expo Go (Android)
- iOS Simulator (macOS)

## Configuración de Firebase

El proyecto utiliza configuración en `config/firebase`.
Para que funcione en tu entorno, asegurate de tener el archivo configurado con tu proyecto Firebase.

Datos usados en Realtime Database:

- `addresses/{uid}`
  - Lista de direcciones del usuario (con `isDefault`)
- `ratings/{uid}/{orderId}`
  - Calificación del pedido (estrellas) + snapshot básico

## Verificación de cuenta (Email Verification)

Para mejorar la seguridad del registro, se implementó verificación de email con **Firebase Auth**:

- Al registrarse con email/contraseña se envía un correo con un link de verificación (`sendEmailVerification`).
- Mientras `emailVerified` sea `false`, el usuario **no puede ingresar** a la app y se lo redirige a `/(auth)/verify-email`.
- En `/(auth)/verify-email` el usuario puede:
  - **Reenviar correo**
  - **Ya verifiqué (revisar)**: recarga el estado (`reload`) y, si ya quedó verificado, lo redirige a `/(tabs)`
  - **Cerrar sesión**

Notas:

- Asegurate de tener habilitado el proveedor **Email/Password** en Firebase Auth.
- En algunos casos puede tardar unos segundos en reflejarse el `emailVerified` luego de tocar el link.

## Estructura del proyecto (resumen)

```text
app/
  (auth)/           # login/register
  (tabs)/           # bottom tabs: Inicio, Carrito (FAB), Perfil
  account/          # direcciones, perfil, publicaciones
  orders/           # listado y seguimiento
  product/          # detalle de producto
  favorites/        # favoritos
  notifications.js  # feed de notificaciones
  rate/[orderId].js # pantalla para calificar pedido

services/
  notificationsService.js
  ordersService.js
  listingsService.js

store/
  store.js
  slices/
    authSlice.js
    cartSlice.js
    favoritesSlice.js
    notificationsSlice.js
```

## Redux Toolkit (estado global)

- **Cart**
  - Items, cantidades, total, persistencia
- **Favorites**
  - Lista de favoritos, persistencia
- **Auth**
  - Estado de sesión sincronizado con el hook de auth
- **Notifications**
  - Feed persistido + unread count

## Notificaciones

Tipos usados:

- `preparing`
- `dispatched`
- `on_the_way`
- `door`
- `delivered`
- `rate` (solicitud de calificación)

Notas:

- En **Expo Go**, las notificaciones del sistema pueden estar limitadas.
- Para notificaciones push completas se recomienda una **development build**.

Preferencias:

- **Notificaciones push**: controla si se muestran notificaciones emergentes (del sistema y toast in-app).
- **Actualizaciones de pedidos**: controla si se generan notificaciones asociadas al flujo del pedido (estados + solicitud de calificación).
- **Ofertas y promociones**: controla la visibilidad de secciones/promos en Home (banners y accesos rápidos relacionados).
- **Correo**: no está implementado (no hay envío real de emails en esta entrega).

## APK Android (build instalable)

Esta entrega incluye un **APK instalable** generado con **EAS Build**.

Notas importantes:

- En **Expo Go**, algunas APIs nativas pueden estar limitadas.
- En el **APK (standalone / dev build)**, se habilitan mejor las capacidades nativas.
- En particular, las **notificaciones push del sistema** funcionan mejor en APK que en Expo Go.

APK: Link del build (EAS):

- https://expo.dev/accounts/ripperzz/projects/shift/builds/7a999fe3-278f-4482-84ef-5f34755596e8

## Flujo de pedidos y calificación

1. Checkout crea el pedido.
2. El pedido avanza estados automáticamente (scheduler in-app) y genera notificaciones.
3. Al llegar a **Entregado**, se genera una notificación `rate`.
4. Al abrirla, se abre `rate/[orderId]`:
   - el usuario selecciona estrellas
   - se guarda en `ratings/{uid}/{orderId}`
   - se muestra “Gracias por tu opinión”.

## Decisiones y notas para la entrega

- El catálogo de productos es **mock** (ideal para demo y navegación completa).
- Los pedidos se guardan en **AsyncStorage** (mock) para una experiencia offline/simple.
- Direcciones y ratings se guardan en **Firebase Realtime Database** para persistencia por usuario.
- **Persistencia offline (SQLite)**:
  - Al abrir Home se intenta leer productos desde SQLite (si existen) para cargar rápido.
  - Luego se intenta refrescar desde Firebase y se vuelven a guardar en SQLite.
  - Si Firebase falla/no hay red, se continúa usando el cache local.

## Funcionalidades de Cámara y Location (dónde se usan)

- **Cámara / galería (expo-image-picker)**
  - Se usa para seleccionar/actualizar la **foto de perfil (avatar)**.
  - Archivos principales:
    - `app/(tabs)/profile.js`
    - `app/account/edit-profile.js`
    - `app/components/ImagePicker.js`
- **Location (ubicación)**
  - Se usa en **Direcciones** para ayudar a completar datos cuando el usuario elige cargar la ubicación.
  - Archivo principal:
    - `app/account/add-address.js`

## Perfil: pantallas e interfaces implementadas

Desde la pestaña **Perfil** se puede navegar a distintas pantallas de cuenta:

- **Perfil (tab)**
  - Ver información del usuario.
  - Cambiar avatar (cámara/galería).
  - Accesos a pantallas de cuenta.
- **Editar perfil** (`app/account/edit-profile.js`)
  - Form para actualizar datos básicos.
  - Actualización de avatar mediante image picker.
- **Direcciones** (`app/account/addresses.js` y `app/account/add-address.js`)
  - CRUD de direcciones.
  - Marcar dirección predeterminada (`isDefault`).
  - (Opcional) carga asistida con ubicación.
- **Mis pedidos** (`app/orders/index.js`)
  - Lista con actualización en vivo (polling mientras la pantalla está activa).
  - Acceso a seguimiento por pedido.

## Privacidad: eliminar cuenta

Desde **Ajustes > Privacidad** existe la opción **“Eliminar mi cuenta”**.

Comportamiento:

- Elimina datos del usuario en **Firebase Realtime Database** (`users/{uid}`)
- Elimina el usuario en **Firebase Auth**
- Limpia persistencias locales asociadas (por ejemplo `savedCards`, `notificationPreferences` en AsyncStorage)

Nota de seguridad (Firebase):

- Firebase puede devolver `auth/requires-recent-login`.
- En ese caso, es necesario **volver a iniciar sesión** y reintentar la eliminación.

## Mis publicaciones (artículos en venta)

Se implementó una sección para que el usuario pueda **crear publicaciones** (artículos a la venta) y verlas en un listado:

- Pantallas principales:
  - `app/account/my-listings.js` (listado)
  - `app/account/create-listing.js` (crear)
- Servicio:
  - `services/listingsService.js`

Estado actual:

- La creación/listado **funciona** (datos en Firebase Realtime Database).
- La carga de **imágenes** puede no funcionar en algunos entornos, porque para usar **Firebase Storage** de forma completa suele ser necesario **habilitar billing (plan Blaze)** en el proyecto Firebase (según configuración/reglas/uso del Storage).

## Problemas conocidos / Limitaciones

- Si corrés en Expo Go, ciertas APIs (por ejemplo, push del sistema) pueden estar limitadas.
- El diseño puede variar levemente según el dispositivo por safe-area / tipo de navegación.
- La carga de imágenes en “Mis publicaciones” puede requerir habilitar **Firebase Storage** con **billing (plan Blaze)**.
- No se implementó envío real de **notificaciones por correo** (solo existe el concepto como preferencia/documentación).
- La verificación de teléfono por **SMS/WhatsApp** no está implementada en esta entrega (requiere integrar un proveedor y/o backend, por ejemplo **Firebase Phone Auth** o **Twilio Verify**).

## Autor

- Proyecto: SHIFT
- Entrega final: App Expo + Redux + Firebase
- Autor: Axel Quinteros
