#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "secrets_config.h" //For wifi/mqtt secrets
// wemos D1 Mini Pro: 
// WIFI parameters MQTT parameters defined in secrets_config.h
//WIFI
//#define wifi_ssid "ssid"
//#define wifi_password "password"

//MQTT
//#define mqtt_user "user"
//#define mqtt_password "password"

#define RELAY_PIN D2
// MQTT Config
const char* BROKER_MQTT = "192.168.100.3";
int BROKER_PORT = 1883;
WiFiClient espClient;
PubSubClient MQTT(espClient);

void setup() {
  initPins();
  initSerial();
  initWiFi();
  initMQTT();
}

void initPins() {
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);
}

void initSerial() {
  Serial.begin(115200);
}

void initWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting: ");
  Serial.println(wifi_ssid);

  WiFi.begin(wifi_ssid, wifi_password); // Wifi Connect
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }

  Serial.println("");
  Serial.print(wifi_ssid);
  Serial.println(" | IP ");
  Serial.println(WiFi.localIP());
}

// MQTT Broker connection
void initMQTT() {
  MQTT.setServer(BROKER_MQTT, BROKER_PORT);
  MQTT.setCallback(mqtt_callback);
}

// Receive messages
void mqtt_callback(char* topic, byte* payload, unsigned int length) {

  String message;
  for (int i = 0; i < length; i++) {
    char c = (char)payload[i];
    message += c;
  }
  Serial.print("Topic ");
  Serial.print(topic);
  Serial.print(" | ");
  Serial.println(message);

  if (message == "1") {
    digitalWrite(RELAY_PIN, LOW);
    delay(1000);
    digitalWrite(RELAY_PIN, HIGH);
    }
    message = "";
    Serial.println();
    Serial.flush();
  }

  void reconnectMQTT() {
    while (!MQTT.connected()) {
      Serial.print("connecting to MQTT: ");
      Serial.println(BROKER_MQTT);
      if (MQTT.connect("ESP8266-garagedoor",  mqtt_user, mqtt_password)) {
        Serial.println("connected");
      MQTT.subscribe("home/garage/activatedoor");
      } else {
        Serial.println("Connection failed");
        Serial.println("retrying in 2 secs");
        delay(2000);
      }
    }
  }

  void recconectWiFi() {
    while (WiFi.status() != WL_CONNECTED) {
      delay(100);
      Serial.print(".");
    }
  }

  void loop() {
    if (!MQTT.connected()) {
    reconnectMQTT(); // Retry Worker MQTT Server connection
  }
  recconectWiFi(); // Retry WiFi Network connection
  MQTT.loop();
}
