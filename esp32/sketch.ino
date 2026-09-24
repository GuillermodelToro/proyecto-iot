#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// ---- WiFi simulado de Wokwi ----
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// ---- Broker MQTT (se reemplaza con la URL de ngrok) ----
const char* mqtt_server = "CAMBIAR_HOST_NGROK";
const int mqtt_port = 0; // CAMBIAR_PUERTO_NGROK

const char* topic_datos = "esp32/sensor";
const char* topic_comandos = "esp32/comandos";

// ---- Pines ----
#define DHTPIN 15
#define DHTTYPE DHT22
#define LED_PIN 2

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

void conectarWiFi() {
  Serial.print("Conectando a WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado. IP: " + WiFi.localIP().toString());
}

void callback(char* topic, byte* payload, unsigned int length) {
  String mensaje;
  for (unsigned int i = 0; i < length; i++) {
    mensaje += (char)payload[i];
  }
  mensaje.trim();
  Serial.println("Comando recibido [" + String(topic) + "]: " + mensaje);

  if (mensaje == "ON") {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("LED ENCENDIDO");
  } else if (mensaje == "OFF") {
    digitalWrite(LED_PIN, LOW);
    Serial.println("LED APAGADO");
  }
}

void conectarMQTT() {
  while (!client.connected()) {
    Serial.print("Conectando a MQTT...");
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println(" conectado!");
      client.subscribe(topic_comandos);
    } else {
      Serial.print(" fallo, rc=");
      Serial.print(client.state());
      Serial.println(" reintentando en 5s");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  dht.begin();
  conectarWiFi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    conectarMQTT();
  }
  client.loop();

  static unsigned long lastMsg = 0;
  unsigned long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    if (isnan(temp) || isnan(hum)) {
      Serial.println("Error leyendo el sensor DHT22");
      return;
    }

    String payload = "{\"temperatura\":" + String(temp) + ",\"humedad\":" + String(hum) + "}";
    Serial.println("Publicando: " + payload);
    client.publish(topic_datos, payload.c_str());
  }
}
