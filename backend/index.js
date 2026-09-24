const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');

const PORT = process.env.PORT || 3000;
const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const TOPIC_DATOS = 'esp32/sensor';
const TOPIC_COMANDOS = 'esp32/comandos';
const MAX_HISTORIAL = 20;

const app = express();
app.use(cors());
app.use(express.json());

let ultimaLectura = null;
let historial = [];
let brokerConectado = false;

// ---------- Conexion MQTT ----------
const client = mqtt.connect(MQTT_URL, { reconnectPeriod: 3000 });

client.on('connect', () => {
  brokerConectado = true;
  console.log(`[MQTT] Conectado a ${MQTT_URL}`);
  client.subscribe(TOPIC_DATOS, (err) => {
    if (!err) console.log(`[MQTT] Suscrito a ${TOPIC_DATOS}`);
  });
});

client.on('message', (topic, message) => {
  const texto = message.toString();
  console.log(`[MQTT] Mensaje en ${topic}: ${texto}`);
  try {
    const data = JSON.parse(texto);
    ultimaLectura = { ...data, fecha: new Date().toISOString() };
    historial.push(ultimaLectura);
    if (historial.length > MAX_HISTORIAL) historial.shift();
  } catch (e) {
    console.log('[MQTT] Mensaje no es JSON, se ignora');
  }
});

client.on('close', () => {
  brokerConectado = false;
  console.log('[MQTT] Desconectado del broker');
});

client.on('error', (err) => {
  console.log('[MQTT] Error:', err.message);
});

// ---------- API REST ----------
app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend IoT funcionando', broker: brokerConectado });
});

app.get('/api/estado', (req, res) => {
  res.json({ broker: brokerConectado, lectura: ultimaLectura });
});

app.get('/api/historial', (req, res) => {
  res.json(historial);
});

app.post('/api/comando', (req, res) => {
  const { comando } = req.body || {};
  if (!comando) {
    return res.status(400).json({ ok: false, error: 'Falta el campo comando' });
  }
  if (!brokerConectado) {
    return res.status(503).json({ ok: false, error: 'Broker MQTT no conectado' });
  }
  client.publish(TOPIC_COMANDOS, String(comando));
  console.log(`[API] Comando enviado al ESP32: ${comando}`);
  res.json({ ok: true, comando });
});

app.listen(PORT, () => {
  console.log(`[API] Backend escuchando en el puerto ${PORT}`);
});
