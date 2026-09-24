# Sistema IoT con ESP32, MQTT y aplicación React Native

Proyecto de la Actividad Calificada 3. Integra un dispositivo IoT (ESP32 simulado en Wokwi),
un servidor Linux Fedora con Docker (broker MQTT + backend) y una aplicación móvil en React Native.

## Arquitectura

    ESP32 + DHT22 + LED (Wokwi)
            |  MQTT (TCP 1883, vía túnel ngrok)
            v
    Mosquitto  <---- MQTT ---->  Backend Node.js (API REST)
    [Docker en Fedora]           [Docker en Fedora]
                                         |  HTTPS (vía túnel ngrok)
                                         v
                              App React Native (Front)

- **IoT (ESP32):** lee temperatura y humedad del DHT22 y las publica cada 5 s en `esp32/sensor`. Se suscribe a `esp32/comandos` y enciende o apaga un LED al recibir `ON` / `OFF`.
- **Broker (Mosquitto):** intermediario MQTT, corre en un contenedor Docker en Fedora.
- **Back (Node.js + Express):** se suscribe a los datos del ESP32 y expone una API REST.
- **Front (React Native):** muestra los datos en tiempo real y envía comandos al ESP32.

## Estructura del repositorio

| Carpeta | Contenido |
|---|---|
| `broker/` | Configuración de Mosquitto (`mosquitto.conf`) |
| `backend/` | API en Node.js (`index.js`, `package.json`, `Dockerfile`) |
| `esp32/` | Firmware del ESP32 (`sketch.ino`) y circuito de Wokwi (`diagram.json`) |
| `app/` | Aplicación React Native (`App.js`) |
| `docker-compose.yml` | Levanta el broker y el backend juntos |

## API del backend

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/estado` | Estado del broker y última lectura del sensor |
| GET | `/api/historial` | Últimas 20 lecturas |
| POST | `/api/comando` | Envía un comando al ESP32. Body: `{"comando": "ON"}` |

## Topics MQTT

| Topic | Dirección | Contenido |
|---|---|---|
| `esp32/sensor` | ESP32 → Broker → Backend | `{"temperatura": 25.3, "humedad": 61.2}` |
| `esp32/comandos` | App → Backend → Broker → ESP32 | `ON` / `OFF` |

## Cómo ejecutar

**1. Servidor (Fedora):**

    git clone <URL_DEL_REPO>
    cd proyecto-iot
    docker-compose up -d --build
    docker ps

**2. Exponer los servicios con ngrok:**

    ngrok tcp 1883    # para el ESP32 (MQTT)
    ngrok http 3000   # para la app (API REST)

**3. ESP32 (Wokwi):** copiar `esp32/sketch.ino` y `esp32/diagram.json` en un proyecto ESP32 de Wokwi, instalar las librerías `PubSubClient`, `DHT sensor library` y `Adafruit Unified Sensor`, y reemplazar el host y puerto del broker con los que entrega `ngrok tcp 1883`.

**4. App (Expo Snack):** copiar `app/App.js` en https://snack.expo.dev y reemplazar `API_URL` con la URL HTTPS que entrega `ngrok http 3000`.

## Tecnologías

Fedora Linux · Docker · Eclipse Mosquitto · Node.js · Express · MQTT · ESP32 · Wokwi · React Native · Expo · ngrok
