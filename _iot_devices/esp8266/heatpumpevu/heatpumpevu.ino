#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "ArduinoJson.h"
#include <ESP8266mDNS.h>  //For OTA
#include "secrets_config.h" //For wifi/mqtt secrets
// WIFI parameters load from secrets_config.h
// const char* SSID = "";
// const char* PASSWORD = "";
// #define MQTTuser ""
// #define MQTTpw ""
// const char* BROKER_MQTT = ""; // MQTT Broker IP 

#define RELAY_PIN D2
// MQTT Config

int BROKER_PORT = 1883;
WiFiClient espClient;
PubSubClient MQTT(espClient); // Instanciar Cliente MQTT

void setup() {
  initPins();
  initSerial();
  initWiFi();
  initMQTT();
 
}

void initPins() {
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);
  pinMode(LED_BUILTIN, OUTPUT);
}

void initSerial() {
  Serial.begin(115200);
}

void initWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting: ");
  Serial.println(SSID);
  WiFi.hostname("HPevu_esp8266");
  MDNS.begin("sonoff-garagevent");
  
  WiFi.begin(SSID, PASSWORD); // Wifi Connect
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }

  Serial.println("");
  Serial.print(SSID);
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
  StaticJsonDocument<64> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
  Serial.print(F("deserializeJson() failed: "));
  Serial.println(error.f_str());
  }
  int state = 1; //if error, always asume heating is enabled
  state = doc["state"];
  Serial.println("state from MQTT:");
  Serial.println(state);

  if (state == 1) {
    digitalWrite(LED_BUILTIN, LOW);  // turn the LED on (HIGH is the voltage level)
    digitalWrite(RELAY_PIN, HIGH); //turn off reley
  } else {
    digitalWrite(LED_BUILTIN, HIGH);  // turn the LED on (HIGH is the voltage level)
    digitalWrite(RELAY_PIN, LOW);    //turn on relay, to turn on EVU to disable heating

  }
    Serial.println();
    Serial.flush();
  }

  void reconnectMQTT() {
    while (!MQTT.connected()) {
      Serial.print("connecting to MQTT: ");
      Serial.println(BROKER_MQTT);
      if (MQTT.connect("ESP8266-HPevu",  MQTTuser, MQTTpw)) {
        Serial.println("connected");
      MQTT.subscribe("home/engineroom/heatpumpevu");
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
