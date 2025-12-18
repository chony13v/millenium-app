# Ciudad FC (millenium-app)

## 1. Descripción general
- Aplicación móvil de participación ciudadana y deporte para Ciudad FC. Permite registrarse a torneos selectivos, responder encuestas, reportar incidencias de la ciudad, asistir a eventos semanales y acumular puntos canjeables por recompensas.
- Público: jugadores y tutores, vecinos que reportan problemas, y administradores que gestionan eventos y catálogo de premios.
- Casos de uso principales: registro a torneos, elección de ciudad/proyecto, consulta de centros deportivos, encuestas y reportes ciudadanos, control de asistencia a eventos, referidos, seguimiento de puntos y canje de premios.
- Plataformas soportadas: Android e iOS. Web no está validado (pendiente de definir).

## 2. Stack tecnológico
- React Native con Expo 54 (nuevo arquitectura habilitada) y Expo Router para navegación por pestañas + stacks.
- Autenticación: Clerk (email/contraseña) y enlace automático a Firebase Auth vía token template `integration_firebase` para autorizar Firestore/Functions.
- Datos: Firebase Firestore como fuente principal; Cloud Functions para lógica crítica (puntos, verificación de asistencia, canjes, referidos, clics en noticias).
- Almacenamiento: Firebase Storage para fotos de reportes ciudadanos; imágenes de perfil se guardan en Firestore como base64.
- Servicios adicionales: Expo Location para distancias y bucket de ubicación, Firebase Analytics (solo si la plataforma lo soporta), Expo Notifications integrada pero deshabilitada (stub), Expo Image Picker para fotos.

## 3. Requisitos previos
- Node.js 18 LTS recomendado (Expo 54).
- npm (proyecto usa `package-lock.json`). Yarn no está soportado oficialmente aquí.
- Expo CLI (vía `npx expo ...`).
- Cuentas y claves: proyecto Clerk (publishable key y template `integration_firebase` configurado), proyecto Firebase con Firestore/Functions/Storage y `google-services.json` / `GoogleService-Info.plist`, cuenta de Expo/EAS para builds internas y distribución (Google Play / App Store según aplique).

## 4. Instalación y ejecución local
1) Clonar el repositorio  
```bash
git clone <url> && cd millenium-app
```
2) Instalar dependencias (dev-client incluido):  
```bash
npm install
```
Si el script `npm run export:csv` se usa en tu entorno y faltan binarios, instala dev deps:  
```bash
npm install --save-dev ts-node @types/node
```
3) Crear `.env` con las variables de entorno (ver sección 5).  
4) Ejecutar en desarrollo (Metro + dev client/Expo Go según tu dispositivo):  
```bash
npx expo start --dev-client   # recomendado para iOS/Android con dev client
# o
npx expo start                # para Expo Go
```
5) Dispositivo físico:
   - Android: `npx expo run:android` (genera y abre el dev client).  
   - iOS (Mac): `npx expo run:ios` (simulador o dispositivo con dev client).  
6) Web no está validado; si necesitas probar: `npx expo start --web` (pendiente de soporte oficial).

## 5. Variables de entorno
Configura en `.env` o en los perfiles de EAS. Las variables `EXPO_PUBLIC_*` quedan embebidas en el cliente.

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY | Sí | Autenticación con Clerk en cliente. |
| EXPO_PUBLIC_FIREBASE_API_KEY | Sí | Config Firebase. |
| EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN | Sí | Config Firebase. |
| EXPO_PUBLIC_FIREBASE_PROJECT_ID | Sí | Config Firebase. |
| EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET | Sí | Config Firebase / Storage. |
| EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | Sí | Config Firebase. |
| EXPO_PUBLIC_FIREBASE_APP_ID | Sí | Config Firebase. |
| EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID | Sí | Validado en runtime por `FirebaseConfig`. |
| EXPO_PUBLIC_PLAY_STORE_URL \| PLAY_STORE_URL | Opcional | Link directo a Play Store para referidos. |
| EXPO_PUBLIC_APP_STORE_URL \| APP_STORE_URL | Opcional | Link a App Store para referidos. |
| EXPO_PUBLIC_APP_DL_BASE_URL \| APP_DL_BASE_URL | Opcional | URL base de descarga usada en links de referidos. |
| EXPO_PUBLIC_REFERRER_REWARD_POINTS | Opcional | Override puntos para quien comparte código. |
| EXPO_PUBLIC_REDEEMER_REWARD_POINTS | Opcional | Override puntos para quien canjea código. |
| EXPO_PUBLIC_ANON_SALT \| ANON_SALT | Opcional | Sal de anonimización (ver `config/PrivacyConfig.ts`). |

## 6. Arquitectura del proyecto
- `app/_layout.tsx`: raíz de Expo Router; monta ClerkProvider y sincroniza con Firebase/ciudad.
- `app/(auth)`: pantallas de inicio de sesión/registro (`sign-in`, `sign-up`, `SignInForm`).
- `app/(call)`: pestañas principales (`Home`, `Fields`, `Conecta`, `Metodology`, `Profile`) con layout en `app/(call)/_layout.tsx`.
- `app/screens`: pantallas auxiliares (calendario, perfil de lectura, ajustes) que se navegan desde el drawer.
- `components/`: UI reutilizable (forms de perfil, cards de recompensas, modales de eventos, navegación, etc.).
- `hooks/`: lógica de estado/efectos (selección de ciudad, puntos, encuestas, reportes, eventos semanales, referidos, Firebase UID).
- `services/`: integraciones con Firebase (auth, points, rewards, events, reports, analytics, location, referrals, news).
- `config/`: configuración central (Firebase, Clerk, flags, admin, privacidad).
- `constants/`: catálogos y valores de negocio (ciudades, puntos, colores, posiciones, redes sociales, flags).
- `shared/`: utilidades de negocio compartidas (configuración de puntos).
- `styles/`, `utils/`, `types/`, `assets/`: estilos, helpers, typings y recursos.
- `functions/`: (si se usa) código de Cloud Functions; la app cliente asume que las funciones remotas ya están desplegadas.

## 7. Funcionalidades principales (operativas)
- **Registro e inicio de sesión**: Clerk con email/contraseña en `app/(auth)`. Tras autenticarse, `ClerkAppProviders` enlaza la sesión a Firebase Auth usando el template `integration_firebase` para habilitar Firestore/Functions.
- **Selección de ciudad/proyecto**: persistida por usuario en AsyncStorage (`useCitySelection`). Sin ciudad elegida no se muestran tabs principales.
- **Perfil de usuario**:  
  - Formulario de registro al torneo selectivo en pestaña `REGISTRO` (`app/(call)/Profile.tsx`). Valida secciones y guarda en `Participantes/{clerkUserId}`. Solo está disponible si el flag `TOURNAMENTS_ENABLED` es `true`; si está en `false`, el tab muestra alerta y no navega.  
  - Lectura/visualización en `app/screens/ProfileScreen.tsx`, con cambio de foto (base64) y resumen de datos.
- **Sistema de puntos y recompensas** (`Metodology` / “CLUB FC”):  
  - Perfil de puntos en `users/{uid}/points_profile/profile` y bitácora en `users/{uid}/points_ledger`. Se sincroniza al abrir sesión y se auto-crea si falta.  
  - Acciones que otorgan puntos: apertura diaria, respuestas de encuestas, reportes ciudadanos, asistencia a eventos semanales (geovallidada), clics en noticias, seguir redes oficiales, referidos y canjes.  
  - Historial y progreso visibles en las secciones “Puntos” y “Transacciones”.
- **Catálogo y canje de recompensas**:  
  - Lista en `Metodology > Premios` (`app/(call)/Metodology/rewards/index.tsx`) filtrada por ciudad si aplica (`rewards` collection).  
  - Detalle y canje en `.../[rewardId].tsx`: llama a la Cloud Function `createRedemptionWithPoints`, crea `redemptions` y genera QR (`https://milleniumfc.com/canje?id=...`). Se muestra el último estado del canje en tiempo real.
- **Torneos / eventos**:  
  - Registro de aspirantes: formulario de 3 pasos (datos personales, tutor, consentimientos) en `REGISTRO`. Previene duplicados con `getExistingRegistration`.  
  - Calendario de proyecto (`app/screens/CalendarScreen.tsx`): consume `GlobalEvents` por ciudad y marca la fecha de cita (`dateTime`) del participante si existe. Admins pueden crear/editar eventos globales.  
  - Eventos semanales en `Conecta`: lista desde `weeklyEvents`, registro de asistencia en `weeklyEventAttendance` con foto/coords y verificación mediante Cloud Functions (`verifyWeeklyEventAttendance` o fallback).
- **Reportes ciudadanos (“Conecta”)**:  
  - Encuestas (`surveys` / `surveyResponses`) con puntos por voto y opción de capturar ubicación bucket.  
  - Reportes con texto + foto opcional (`cityReports`, fotos en Storage `/reports/{userId}/...`), status inicial `pendiente` y puntos por reporte.  
  - Registro de ubicación bucket (`locationEvents`) desde el botón de ubicación o encuestas.
- **Noticias y academia**:  
  - Noticias por ciudad desde `News`; al abrir se llama a la función `awardNewsClick` para otorgar puntos.  
  - Videos/academy y categorías se leen de colecciones públicas (`videoData`, `Academy`, `Category`).
- **Roles y permisos**:  
  - Admin UI se controla en `config/AdminConfig.ts` (edición de eventos desde calendario).  
  - Reglas Firestore permiten escritura admin solo al email `f13vasconez@gmail.com` (ajustar reglas si agregas más admins).  
  - Usuarios deben estar autenticados y enlazados a Firebase para encuestas, reportes, asistencia, canjes y puntos.
- **Notificaciones**: Hooks presentes (`usePushTokenSync`, `usePushNotifications`), pero el servicio actual (`services/notifications/push.ts`) está deshabilitado y solo loguea; pendiente implementar envío/registro real.

## 8. Configuración Firebase
- Colecciones principales:  
  - `Participantes/{userId}`: registro de torneo + foto y expoPushToken.  
  - `users/{uid}/points_profile`, `users/{uid}/points_ledger`, `users/{uid}/social_meta`, `users/{uid}/public_profile` (código de referidos).  
  - `rewards`, `redemptions` (canjes).  
  - `weeklyEvents`, `weeklyEventAttendance` (asistencia con coords/foto).  
  - `GlobalEvents` (eventos de proyecto para calendario).  
  - `surveys`, `surveyResponses`; `cityReports`; `locationEvents`; `Field`; `Category`; `News`; `videoData`; `Academy`; `mensajesContacto`.
- Cloud Functions usadas por el cliente: `createRedemptionWithPoints`, `verifyWeeklyEventAttendance`, `awardPointsEvent` (fallback genérico), `awardNewsClick`, `ensureReferralCode`, `redeemReferralCode`.
- Reglas de seguridad (resumen): dueño o admin puede leer/escribir `Participantes`; colecciones públicas son solo lectura; encuestas, reportes y asistencia validan `request.auth.uid`; escrituras admin restringidas al email en reglas (`f13vasconez@gmail.com`). Ajustar reglas si cambian los correos admin.
- Índices relevantes (`firestore.indexes.json`): `locationEvents` y `cellsDaily` (ciudad/geohash/parish + date) para agregados de ubicación.
- Storage: fotos de reportes en `/reports/{userId}/timestamp.ext`. No hay subida de imágenes de recompensas desde el cliente.

## 9. Flujos críticos
- **Autenticación**: Clerk gestiona sesión; `linkClerkSessionToFirebase` firma con token `integration_firebase`. Si falta el template o el token expira, Firestore/Functions fallan. Verificar enlace antes de probar puntos o canjes.
- **Canje de recompensa**: requiere sesión Firebase válida y puntos suficientes. El detalle llama a la función de canje, crea `redemptions/{id}`, descuenta puntos y entrega QR. El estado se escucha por snapshot; si falla la función, no se descuenta.
- **Registro/cierre de torneos**: flag `config/FeatureFlags.ts::TOURNAMENTS_ENABLED` controla acceso al tab. Cada usuario puede tener un registro en `Participantes/{userId}`; si existe se muestra alerta y se bloquea re-registro. Para “cerrar” inscripciones basta poner el flag en `false` (el tab muestra alerta y no navega).
- **Flujo de puntos**:  
  - Otorgamiento cliente: app_open_daily, poll_vote, city_report_created, awardNewsClick, social follow; la app evita duplicados básicos.  
  - Asistencia semanal: crea/actualiza `weeklyEventAttendance`, sube foto a Storage si aplica, llama a verificación de distancia/función para otorgar puntos y marcar `pointsStatus`.  
  - Canjes y referidos ajustan el balance vía Functions y se reflejan en `points_ledger`.

## 10. Feature flags y configuraciones
- `config/FeatureFlags.ts`: `TOURNAMENTS_ENABLED` habilita/deshabilita el tab de registro (muestra alerta si está apagado).
- `config/AdminConfig.ts`: lista de correos con capacidades de UI admin; las reglas Firestore usan un correo fijo, mantener ambas listas alineadas.
- `constants/cities.ts`: ciudades/proyectos disponibles y sus gradientes.
- `shared/pointsConfig.ts` y `constants/points.ts`: valores de puntos y etiquetas de eventos.
- `config/PrivacyConfig.ts`: obtiene `ANON_SALT` si se usa anonimización.
- URLs de tiendas y recompensas de referidos se ajustan vía variables `EXPO_PUBLIC_*_URL` y puntos de referidos (`EXPO_PUBLIC_REFERRER_*`).

## 11. Build y despliegue
- Perfiles EAS (`eas.json`): `development` (dev client apk), `preview` (internal), `production` (store). Todos inyectan `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`; agrega el resto de variables en Secrets o `.env`.
- Comandos típicos:
  - `eas build --platform android --profile development` (APK dev client).
  - `eas build --platform android --profile production` (AAB para Play Store).
  - `eas submit -p android --latest --key <keystore>` según tu flujo.
- Versionado: actualizar `app.json` (`version` y `android.versionCode`; si agregas iOS, usa `ios.buildNumber`). `runtimeVersion` está fijada en `1.0.0+firebase-test`.
- Archivos nativos: `google-services.json` está incluido para Android; agrega `GoogleService-Info.plist` para iOS si falta.

## 12. Buenas prácticas y advertencias
- No subas claves a git; usa `.env` o secretos de EAS. Las `EXPO_PUBLIC_*` quedan embebidas en el binario.
- Verifica que Clerk pueda emitir el token `integration_firebase`; sin eso fallan Firestore/Functions y el puntaje.
- Si agregas nuevos admins, actualiza tanto `config/AdminConfig.ts` como `firestore.rules`.
- Mantén nombres de colecciones/tipos al crear datos manualmente; las reglas validan esquemas (encuestas, reportes, asistencia).
- Push notifications están deshabilitadas; antes de habilitar, reemplaza `services/notifications/push.ts` y revisa permisos en `app.json`.
- Optimiza pruebas de ubicación: solicita permisos antes de capturar coords y usa dispositivos reales para flujos de asistencia/canje con ubicación.
- Scripts útiles: `npm run lint`, `npm test` (jest-expo), `npm run export:csv` (requiere `ts-node` y `@types/node` instalados).

## 13. Roadmap (opcional)
- Definir e implementar notificaciones push reales (registro y listeners).
- Validar soporte web o documentar que no será soportado.
- Alinear lista de correos admin entre reglas de Firestore y configuración de cliente.
- Añadir monitoreo de fallos en Cloud Functions críticas (canje, asistencia, referidos).

## Torneos: cómo habilitar la pestaña

El acceso a la pestaña de torneos está controlado por un flag en `config/FeatureFlags.ts`. Para activarlo o desactivarlo:

1. Abre `config/FeatureFlags.ts`.
2. Cambia el valor de `TOURNAMENTS_ENABLED` a:
   - `true` para mostrar la pestaña y permitir el flujo de inscripción.
   - `false` para ocultar el acceso (el tab muestra una alerta y no navega).
3. Guarda el archivo y vuelve a cargar la app (`npx expo start` ya en ejecución recarga automáticamente).
