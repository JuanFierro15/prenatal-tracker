# 🤰 Bebe Totodrilo

> Aplicación móvil de seguimiento del embarazo desarrollada con React Native y Expo.

---

## Descripción

**Bebe Totodrilo** es una app de acompañamiento prenatal diseñada para que los futuros papás lleven un registro completo y organizado de todo el embarazo, desde el primer día hasta el parto. Incluye seguimiento médico, registro emocional, contador de patadas, gestión de documentos y mucho más, todo almacenado de forma local y privada en el dispositivo.

---

## Capturas de pantalla

> *Próximamente*

---

## Funcionalidades

### 📊 Seguimiento del embarazo
- **Pantalla de inicio** — semana actual, comparación con frutas, días restantes y fecha probable de parto calculada automáticamente desde la FUR
- **Desarrollo semanal** — información detallada del desarrollo del bebé semana a semana
- **Gráfico de peso** — registro de peso con curvas recomendadas según las guías IOM 2009 por categoría de IMC

### 🏥 Gestión médica
- **Citas médicas** — agenda de controles con recordatorios por notificación (3 horas antes y aviso a las 8 AM del día)
- **Documentos** — almacenamiento de PDFs e imágenes médicas (ecografías, exámenes, recetas) organizados por categoría y semana
- **Síntomas** — registro diario de síntomas con niveles de intensidad

### 👶 Monitoreo fetal
- **Contador de patadas** — implementación del método Cardiff Count-to-Ten (ACOG) con guías adaptadas por semana gestacional, historial de sesiones y recordatorio diario
- **Contracciones** — cronómetro de contracciones con registro de duración y frecuencia

### 📖 Registro personal
- **Diario** — entradas diarias con estado de ánimo (emojis), texto y foto
- **Fotos** — álbum de fotos de barriga semana a semana y momentos especiales
- **Nombres** — lista de nombres con sistema de votación (mamá y papá votan por separado)
- **Checklist** — lista de tareas personalizable para preparar la llegada del bebé

### 🛠️ Utilidades
- **Emergencia** — contactos de emergencia y datos médicos de acceso rápido
- **Backup** — exportación e importación de todos los datos en formato JSON
- **Ajustes** — configuración del perfil (nombres, fecha FUR, sexo del bebé)

---

## Onboarding

Al iniciar la app por primera vez, un flujo de bienvenida guía al usuario a través de:

1. Restaurar datos desde un backup existente, o comenzar desde cero
2. Nombre del bebé *(opcional)*
3. Nombres de mamá y papá
4. Fecha de la última regla (FUR) — calcula automáticamente la semana actual y la fecha probable de parto
5. Sexo del bebé *(opcional)*

---

## Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| React Native | 0.81.5 | Framework principal |
| Expo | ~54.0.0 | Plataforma y herramientas |
| TypeScript | ~5.9.2 | Lenguaje |
| React Navigation | v7 | Navegación (Stack + Bottom Tabs) |
| AsyncStorage | 2.2.0 | Persistencia local |
| expo-notifications | ~0.32.17 | Notificaciones locales |
| expo-file-system | ~19.0.23 | Manejo de archivos |
| expo-document-picker | ~14.0.8 | Selección de PDFs e imágenes |
| expo-image-picker | ~17.0.11 | Cámara y galería |
| expo-intent-launcher | ~13.0.8 | Apertura de archivos en Android |
| expo-sharing | ~14.0.8 | Compartir archivos |
| react-native-svg | 15.12.1 | Gráficos SVG (gráfico de peso) |

---

## Arquitectura

```
App.tsx                          # Entrada: onboarding o app principal (Stack Navigator)
├── MainTabs (BottomTabNavigator)
│   ├── HomeScreen               # Inicio con resumen semanal y accesos rápidos
│   ├── CitasScreen              # Citas médicas
│   ├── DiarioScreen             # Diario emocional
│   └── DesarrolloScreen         # Desarrollo fetal semanal
└── Stack screens
    ├── PatadosScreen            # Contador de patadas
    ├── SintomasScreen           # Registro de síntomas
    ├── ChecklistScreen          # Lista de tareas
    ├── ContraccionesScreen      # Cronómetro de contracciones
    ├── NombresScreen            # Votación de nombres
    ├── FotosScreen              # Álbum de fotos
    ├── EmergenciaScreen         # Contactos de emergencia
    ├── PesoScreen               # Gráfico de peso
    ├── BackupScreen             # Backup / restauración
    ├── DocumentosScreen         # Documentos médicos
    └── AjustesScreen            # Configuración
```

**Persistencia:** toda la información se guarda localmente con `AsyncStorage` en el dispositivo. No hay servidor, no hay base de datos en la nube, no hay cuentas. Los datos son completamente privados.

**Tipos globales:** definidos en `src/types/index.ts`.

**Datos estáticos:** `src/constants/desarrolloData.ts` contiene la información de desarrollo fetal semana a semana.

---

## Instalación y desarrollo

### Requisitos
- Node.js 18+
- Expo Go instalado en el dispositivo (para desarrollo)

### Clonar e instalar
```bash
git clone https://github.com/JuanFierro15/prenatal-tracker.git
cd prenatal-tracker
npm install
```

### Ejecutar en desarrollo
```bash
# Iniciar servidor (escanear QR con Expo Go)
npm start

# Plataforma específica
npm run android
npm run ios
npm run web
```

---

## Build

El proyecto usa [EAS Build](https://docs.expo.dev/build/introduction/) para generar el APK.

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# APK para distribución directa
eas build -p android --profile preview

# AAB para Google Play Store
eas build -p android --profile production
```

### Publicar actualizaciones sin generar nuevo APK
```bash
eas update --branch production --message "descripción del cambio"
```

> Un nuevo APK solo es necesario cuando se agregan librerías nativas, se cambian permisos o se actualiza la versión del SDK.

---

## Estructura del proyecto

```
├── App.tsx                      # Punto de entrada
├── app.json                     # Configuración de Expo
├── eas.json                     # Perfiles de build
├── src/
│   ├── screens/                 # Todas las pantallas
│   ├── constants/               # Datos estáticos (desarrollo fetal, colores)
│   ├── types/                   # Tipos TypeScript globales
│   └── utils/                   # Utilidades (notificaciones, backup)
└── assets/                      # Íconos e imágenes
```

---

## Licencia

Este proyecto es de uso personal y no tiene licencia de distribución abierta.
