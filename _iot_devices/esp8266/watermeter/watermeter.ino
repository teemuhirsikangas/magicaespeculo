

#include <ESP8266WiFi.h>  //For ESP8266
#include <PubSubClient.h> //For MQTT
#include <ESP8266mDNS.h>  //For OTA
#include <WiFiUdp.h>      //For OTA
#include <ArduinoOTA.h>   //For OTA

//WIFI configuration
#define wifi_ssid "xxx"
#define wifi_password "xxx"

//MQTT configuration
#define mqtt_server "192.168.100.3"
#define mqtt_user "xxxx"
#define mqtt_password "xxxx"
String mqtt_client_id="ESP8266-watermeter-";   //This text is concatenated with ChipId to get unique client_id
//MQTT Topic configuration
#define topic "home/engineroom/watermeter"
int status = WL_IDLE_STATUS;
#define LRD_PIN D2
const int ledPin =  LED_BUILTIN;

#define cyclecount (10) // Circular buffer size for 
                         // measurements = 1sec * 10samples/sec
float Tbuffer[(int)cyclecount];
int counter = 0;
#define hitTreshold (3) // if more than 3 hits in cyclecount, -> mark that 1 liter has consumed
boolean hitFlag = false; // set the hit flag to true once threshold is hit, and send data when last 10 measures all are 0

//MQTT client
WiFiClient espClient;
PubSubClient mqtt_client(espClient);

//Necesary to make Arduino Software autodetect OTA device
WiFiServer TelnetServer(8266);

void setup_wifi() {
  delay(10);
  Serial.print("Connecting to ");
  Serial.print(wifi_ssid);
  WiFi.hostname("esp-watermeter");
  WiFi.begin(wifi_ssid, wifi_password);
  MDNS.begin("esp-watermeter");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("OK");
  Serial.print("   IP address: ");
  Serial.println(WiFi.localIP());
}

void setup() { 
  Serial.begin(115200);
  Serial.println("\r\nBooting...");
  
  setup_wifi();

  unsigned long lastSend = 0;
  pinMode(ledPin, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);

  for (int i=0;i!=cyclecount;i++) { // Init circular buffer with 0:s
    Tbuffer[i]=0;
  }

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
  mqtt_client_id=mqtt_client_id+ESP.getChipId();
  mqtt_client.setServer(mqtt_server, 1883);
  Serial.printf("   Server IP: %s\r\n",mqtt_server);  
  Serial.printf("   Username:  %s\r\n",mqtt_user);
  Serial.println("   Cliend Id: "+mqtt_client_id);  
  Serial.println("   MQTT configured!");

  Serial.println("Setup completed! Running app...");
}

long now = 0; //in ms
int min_timeout = 100; //in ms
unsigned long lastDebounceTime = 0;
unsigned long lastSendTime = 0;
boolean ledState = 0;

void loop() {
  
  ArduinoOTA.handle();
  
  if (!mqtt_client.connected()) {
    mqtt_reconnect();
  }
  mqtt_client.loop();

  now = millis();

  // check measurement every 0.1 secs
  if (now - lastDebounceTime > min_timeout) {
    //Serial.println("debounce elapse");
    lastDebounceTime = now;
    now = millis();

    Tbuffer[counter] = digitalRead(LRD_PIN);

     if (counter != cyclecount) {
        counter++; //check if circular buffer is over, and start again 
      } else {
        counter=0;
      }

      // Calculate the sum
      int sum = 0;
      for (int i=0;i!=cyclecount;i++) {
        sum += Tbuffer[i];
      }
      // if there are more than 3 hits/10 measurements -> one liter has been consumed, set hitFlag true
      if (sum >= hitTreshold) {
        hitFlag = true;
      }

      // if hitflag is set and last 10 measurements sum == 0 => the dial has gone through the measurement point -> sent measurement value
      if (hitFlag == true && sum == 0) {

        hitFlag = false;
        ledState = 1;

        Serial.print("Sent ");
        Serial.println(topic);
        String water = "1";
        String payload = "{";
        payload += "\"water\":"; payload += water;
        payload += "}";
        //turn on the led when measurement is send
        digitalWrite(ledPin, LOW);
        sendMsg(topic, payload);
        lastSendTime = millis();
    }
  }

  // turn off the led after 200ms has passed
  if ( now - lastSendTime  > 200 && ledState == 1) {
    digitalWrite(ledPin, HIGH);
    ledState = 0;
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

