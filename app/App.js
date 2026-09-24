import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

// URL publica del backend (se reemplaza con la URL HTTPS de ngrok)
const API_URL = 'https://CAMBIAR-URL-NGROK';

// Cabecera necesaria para que ngrok no muestre su pagina de aviso
const HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

export default function App() {
  const [lectura, setLectura] = useState(null);
  const [broker, setBroker] = useState(false);
  const [backendOk, setBackendOk] = useState(false);
  const [log, setLog] = useState([]);

  const agregarLog = (texto) => {
    const hora = new Date().toLocaleTimeString();
    setLog((prev) => [...prev.slice(-9), `${hora}  ${texto}`]);
  };

  const obtenerEstado = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/estado`, { headers: HEADERS });
      const data = await res.json();
      setBackendOk(true);
      setBroker(data.broker);
      if (data.lectura) setLectura(data.lectura);
    } catch (e) {
      setBackendOk(false);
    }
  }, []);

  useEffect(() => {
    obtenerEstado();
    const intervalo = setInterval(obtenerEstado, 3000);
    return () => clearInterval(intervalo);
  }, [obtenerEstado]);

  const enviarComando = async (comando) => {
    try {
      const res = await fetch(`${API_URL}/api/comando`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ comando }),
      });
      const data = await res.json();
      agregarLog(data.ok ? `Comando enviado: ${comando}` : `Error: ${data.error}`);
    } catch (e) {
      agregarLog('Error: no se pudo contactar al backend');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel IoT - ESP32</Text>

      <View style={styles.statusRow}>
        <Text style={styles.status}>Backend: {backendOk ? '🟢' : '🔴'}</Text>
        <Text style={styles.status}>Broker MQTT: {broker ? '🟢' : '🔴'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Temperatura</Text>
        <Text style={styles.value}>
          {lectura ? `${lectura.temperatura} °C` : '--'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Humedad</Text>
        <Text style={styles.value}>
          {lectura ? `${lectura.humedad} %` : '--'}
        </Text>
      </View>

      <Text style={styles.fecha}>
        Última lectura: {lectura ? new Date(lectura.fecha).toLocaleTimeString() : '--'}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, styles.btnOn]} onPress={() => enviarComando('ON')}>
          <Text style={styles.btnText}>Encender LED</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnOff]} onPress={() => enviarComando('OFF')}>
          <Text style={styles.btnText}>Apagar LED</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.logTitle}>Registro:</Text>
      <ScrollView style={styles.log}>
        {log.map((linea, i) => (
          <Text key={i} style={styles.logLine}>{linea}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ecf0f1', padding: 16, paddingTop: 40 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  status: { fontSize: 15 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 12, alignItems: 'center' },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 30, fontWeight: 'bold' },
  fecha: { textAlign: 'center', color: '#666', marginBottom: 8 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  btn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  btnOn: { backgroundColor: '#27ae60' },
  btnOff: { backgroundColor: '#c0392b' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  logTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  log: { flex: 1, backgroundColor: '#000', borderRadius: 8, padding: 8, marginTop: 8 },
  logLine: { color: '#0f0', fontSize: 12, fontFamily: 'monospace' },
});
