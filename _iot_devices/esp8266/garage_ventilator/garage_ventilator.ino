#include <ESP8266WiFi.h>  //For ESP8266
#include <PubSubClient.h> //For MQTT
#include <ESP8266mDNS.h>  //For OTA
#include <WiFiUdp.h>      //For OTA
#include <ArduinoOTA.h>   //For OTA
#include <DHT.h>
#include "ArduinoJson.h"
#include "secrets_config.h" //For wifi/mqtt secrets

// DHT
#define DHTPIN 3 //GPIO 03 - RX PIN  //GPIO 01 - TX PIN
#define DHTTYPE DHT22 

DHT dht = DHT(DHTPIN, DHTTYPE);

// configured in "secrets_config.h"
//**********************************
//WIFI configuration
//#define wifi_ssid "ssidname"
//#define wifi_password "password"

//MQTT configuration
//#define mqtt_server "192.168.100.3"
//#define mqtt_user "username"
//#define mqtt_password "password"
//**********************************
String mqtt_client_id="ESP8266-garageventilator";
//MQTT Topic configuration
#define mqtt_topic "home/garage/ventilator/status"

//sonoff relay pint
int RELAY_PIN = 12;
int LED_SONOFF = 13;

//wifi status
int status = WL_IDLE_STATUS;

//default values for fan
//can be set via mqtt message
int humid_low = 55;
int humid_high = 65;
String FANMODE = "ON";

//define dht22 sensor and relay status
String humidity;
String temperature;
String FANSTATUS = "ON";

//MQTT client
WiFiClient espClient;
PubSubClient mqtt_client(espClient);

//Necesary to make Arduino Software autodetect OTA device
WiFiServer TelnetServer(8266);

// Receive JSON messages
void mqtt_callback(char* topic, byte* payload, unsigned int length) {

  String message;
  for (int i = 0; i < length; i++) {
    char c = (char)payload[i];
    message += c;
  }
  Serial.print("received Topic ");
  Serial.print(topic);
  Serial.print(" | ");
  Serial.println(message);
  //calculate capacity with: https://arduinojson.org/v6/assistant/
  const size_t capacity = JSON_OBJECT_SIZE(3) + 60;
  DynamicJsonDocument doc(capacity);

  //const char* json =  "{\"mode\":\"AUTO\",\"humid_low\":55,\"humid_high\":65}"

  deserializeJson(doc, message);

  const char* mode = doc["mode"]; // "AUTO" // "ON" // "OFF"
  FANMODE = mode;
  humid_low = doc["humid_low"]; // 55
  humid_high = doc["humid_high"]; // 65

  if (FANMODE == "ON") {
    digitalWrite(RELAY_PIN, HIGH);
    FANSTATUS = "ON";
  } else if (FANMODE == "OFF") {
    digitalWrite(RELAY_PIN, LOW);
    FANSTATUS = "OFF";
  } else if ( FANMODE == "AUTO") {
    handleFanAUTOmode();
  }
  //send status back after every message received
  getAndSendTemperatureAndHumidityData();
}

void setup_wifi() {
  delay(10);
  Serial.print("Connecting to ");
  Serial.print(wifi_ssid);
  WiFi.hostname("sonoff-garagevent");
  WiFi.begin(wifi_ssid, wifi_password);
  MDNS.begin("sonoff-garagevent");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("OK");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void setup() { 
  Serial.begin(115200);
  Serial.println("\r\nBooting...");
  
  //Relay always ON if no access to networks etc, works as dummy cable
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);
  pinMode(LED_SONOFF, OUTPUT);
  digitalWrite(LED_SONOFF, LOW); // LOW will turn on the LED

  setup_wifi();

  Serial.print("Configuring OTA device...");
  TelnetServer.begin();   //Necesary to make Arduino Software autodetect OTA device  
  ArduinoOTA.onStart([]() {Serial.println("OTA starting...");});
  ArduinoOTA.onEnd([]() {Serial.println("OTA update finished!");Serial.println("Rebooting...");});
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {Serial.printf("OTA in progress: %u%%\r\n", (progress / (total / 100)));});  
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR) Serial.println("End Failed");
  });
  ArduinoOTA.begin();
  Serial.println("OK");

  Serial.println("Configuring MQTT server...");
  mqtt_client.setServer(mqtt_server, 1883);
  //Listen mqtt messages
  mqtt_client.setCallback(mqtt_callback);
  Serial.printf("   Server IP: %s\r\n",mqtt_server);  
  Serial.printf("   Username:  %s\r\n",mqtt_user);
  Serial.println("   Cliend Id: "+mqtt_client_id);  
  Serial.println("   MQTT configured!");
  digitalWrite(LED_SONOFF, HIGH); // HIGH will turn off the LED

  dht.begin();

  Serial.println("Setup completed! Running app...");
}

long now = 0; //in ms
long lastMsg = 0;
long nowMin = 0;
long lastMsgMin = 0;
int MINUTE = 1000 *60; //in ms
int FANAUTOMODE_timeout = 1000*60*10; //10min in ms

void reconnectWiFi() {
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
}

void mqtt_reconnect() {

  // Loop until we're reconnected
  while (!mqtt_client.connected()) {

    status = WiFi.status();
    if ( status != WL_CONNECTED) {
      WiFi.begin(wifi_ssid, wifi_password);
      while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
      }
      Serial.println("Connected to AP");
    }

    Serial.print("Attempting MQTT connection...");
    // Attempt to connect

    if (mqtt_client.connect(mqtt_client_id.c_str(), mqtt_user, mqtt_password)) {
      Serial.println("connected");
        mqtt_client.subscribe("home/garage/ventilator/cmd");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqtt_client.state());
      Serial.println(" try again in 1 seconds");
      // Wait 1 seconds before retrying
      delay(1000);
    }
  }
}

boolean mqtt_publish(char* topic_tosend, String payload_tosend) {
  if (WiFi.status() == WL_CONNECTED) {
    if (mqtt_client.connect((char*) mqtt_client_id.c_str(), mqtt_user, mqtt_password)) {
      unsigned int msg_length = payload_tosend.length();
      byte* p = (byte*)malloc(msg_length);
      memcpy(p, (char*) payload_tosend.c_str(), msg_length);

      if (mqtt_client.publish(topic_tosend, p, msg_length, 1)) {
        free(p);
        //todo: neeed?
        mqtt_client.disconnect();
        Serial.println(payload_tosend);
        return 1;
      } else {
        free(p);
        mqtt_client.disconnect();
        return 0;
      }
    } else {
      Serial.println("mqtt conn failed");
      return 0;
    }
  } else {
    Serial.println("wifi not connected");
    mqtt_reconnect();
    return 0;
  }
}

boolean sendMsg(char* topic_tosend, String payload_tosend) {
  int Attempt = 0;
  while (mqtt_publish(topic_tosend, payload_tosend) == 0) {
    delay(100);
    Attempt++;
    if (Attempt == 5) {
      Serial.println("mqtt pub failed");
      break;
    }
  }
   //Serial.println("message sent");
}

void getAndSendTemperatureAndHumidityData() {
  Serial.println("Collecting temperature data.");

  // Reading temperature or humidity takes about 250 milliseconds!
  float h = dht.readHumidity();
  // Read temperature as Celsius (the default)
  float t = dht.readTemperature();

  // Check if any reads failed and exit early (to try again).
  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Humidity: ");
  Serial.print(h);
  Serial.print(" %\t");
  Serial.print("Temperature: ");
  Serial.print(t);
  Serial.print(" *C ");

  temperature = String(t);
  humidity = String(h);

  // Just debug messages
  Serial.print( "Sending temperature and humidity : [" );
  Serial.print( temperature ); Serial.print( "," );
  Serial.print( humidity );
  Serial.print( "]   -> " );

  // Prepare a JSON payload string
  String payload = "{";
  payload += "\"temp\":"; payload += temperature; payload += ",";
  payload += "\"humid\":"; payload += humidity; payload += ",";
  payload += "\"mode\":"; payload += "\""; payload += FANMODE; payload += "\""; payload += ",";
  payload += "\"fan\":"; payload += "\""; payload += FANSTATUS; payload += "\"";;
  payload += "}";
  
  digitalWrite(LED_SONOFF, LOW); // LOW will turn on the LED
  sendMsg(mqtt_topic, payload);
  delay(200);
  digitalWrite(LED_SONOFF, HIGH); // HIGH will turn off the LED
}

void loop() {
  
  ArduinoOTA.handle();
  
  if (!mqtt_client.connected()) {
    mqtt_reconnect();
  }
  reconnectWiFi(); // Retry WiFi Network connection
  mqtt_client.loop();
  
  now = millis();
  nowMin = millis();

  //if mode == AUTO, check the min max values every 10minutes only
  //unless there is new mode change from mqtt
  if (now - lastMsg > FANAUTOMODE_timeout) {
      lastMsg = now;
    if (FANMODE == "AUTO") {
      handleFanAUTOmode();
      getAndSendTemperatureAndHumidityData();
    }
  }
  //send humid,temp, fan status values once in a minute
  if (nowMin - lastMsgMin > MINUTE) {
    Serial.println("Checking AUTO MODE status");
    lastMsgMin = nowMin;
    getAndSendTemperatureAndHumidityData();
  }
}

void handleFanAUTOmode() {

    // Reading temperature or humidity takes about 250 milliseconds!
    float h = dht.readHumidity();
    // Read temperature as Celsius (the default)
    float t = dht.readTemperature();
  
    // Check if any reads failed and exit early (to try again).
    if (isnan(h) || isnan(t)) {
      Serial.println("Failed to read from DHT sensor! enabling FAN");
      digitalWrite(RELAY_PIN, HIGH);
      FANSTATUS = "ON";
    } else {
      Serial.print("handleFanAUTOmode: ");
      Serial.print("Humidity: ");
      Serial.print(h);
      Serial.print(" %\t");
      Serial.print("Temperature: ");
      Serial.print(t);
      Serial.print(" *C ");

      //stop fan
      if (h <= humid_low ) {
         digitalWrite(RELAY_PIN, LOW);
         FANSTATUS = "OFF";
      }
      //start fan
      if (h >= humid_high) {
        digitalWrite(RELAY_PIN, HIGH);
        FANSTATUS = "ON";
      }
    }

}
