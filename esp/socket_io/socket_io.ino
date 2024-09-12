#include <Arduino.h>

#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>

#include <ArduinoJson.h>

#include <WebSocketsClient.h>
#include <SocketIOclient.h>

#include <Hash.h>
#include <AccelStepper.h>

// Migrated Events
// status [event type] new_name_of_the_event (old_name_of_the_event)
// ✔ [READ] type (type)
// ✔ [READ] ping (ping)
// ✔ [SENT] analog-read (continuousData)
// ✔ [READ] plant-control (motorControl)
// ✔ [READ] motor-state (startMotor - stopMotor)
// ✔ [READ] variables-states (initialStateNode)
// ❌ currentStateNode

// --- Datos de la Red WiFi ---

#define SSID ""
#define PASSWORD ""

// --- Datos del Servidor ---

#define SERVER_URL ""
#define SERVER_PORT 4200

// --- Datos del Nodo ---

#define NODE_NAME ""

#define MOTOR_PIN_1 12
#define MOTOR_PIN_2 13
#define MOTOR_PIN_3 14
#define MOTOR_PIN_4 15
#define MOTOR_SPEED 1200
#define STEPS_PER_REV 4096
// #define NUM_STEPS 8
// #define STEPS_LOOKUP \
//   {                  \
//       B1000, B1100, B0100, B0110, B0010, B0011, B0001, B1001}

// --- Preprocesamientos ---

// #if !defined(NODE_NAME)
//   #error "NODE_NAME no está definido"
// #elif NODE_NAME[0] != 'p' || NODE_NAME[1] != 'l' || NODE_NAME[2] != 'a' || NODE_NAME[3] != 'n' || NODE_NAME[4] != 't' || NODE_NAME[5] != 'a' || NODE_NAME[6] != '-' || NODE_NAME[7] < '0' || NODE_NAME[7] > '9'
//   #error "NODE_NAME debe comenzar con 'planta-' seguido de un número"
// #endif

// --- Variables ---

bool connectedToServer = false;

// Esta variable establece el modo de trabajo de la planta --> remoto o local
const char *plantControl = "local";

// Esta variable establece el estado del motor (encendido o apagado)
bool motorStatus = false;
// Esta variable establece la dirección de giro del motor (avance ["clockwise"] o retroceso ["anticlockwise"])
const char *motorDirection = "clockwise";

// Variables que establecen el periodo de muestreo y el intervalo de envío de datos del pin analógico A0
unsigned long lastAnalogPinReadTime = 0;
unsigned long sendAnalogDataInterval = 1000 * 1000; // * 1000 para pasar a milisegundos, * 1000 para pasar a segundos

// Guarda el timestamp de la última vez que dió un paso el motor, esto se utiliza para no interferir con el tiempo de muestreo del pin analógico
unsigned long lastMotorActionTimestamp = 0;
unsigned long motorActionInterval = MOTOR_SPEED;

// int stepCounter = 0;
// const int numSteps = NUM_STEPS;
// const int stepsLookup[NUM_STEPS] = STEPS_LOOKUP;

#define USE_SERIAL Serial

ESP8266WiFiMulti WiFiMulti;
SocketIOclient socketIO;
AccelStepper motor(AccelStepper::HALF4WIRE, MOTOR_PIN_1, MOTOR_PIN_3, MOTOR_PIN_2, MOTOR_PIN_4);

void socketIOEvent(socketIOmessageType_t type, uint8_t *payload, size_t length)
{
  switch (type)
  {
  case sIOtype_DISCONNECT:
  {
    USE_SERIAL.printf("[IOc] Disconnected!\n");
    connectedToServer = false;
    break;
  }
  case sIOtype_CONNECT:
  {
    USE_SERIAL.printf("[IOc] Connected to url: %s\n", payload);

    connectedToServer = true;

    // Al conectarse la planta (nodo) al servidor se establece (por defecto) la planta en modo "remote"
    plantControl = "remote";

    JsonDocument doc;
    JsonArray array = doc.to<JsonArray>();

    // El nodo responde al servidor identificandose como tipo "node"
    array.add("type");

    // Para enviar un objecto en el payload -> { "data": "node" }
    // JsonObject payload = array.createNestedObject();
    // payload["data"] = "node";

    array.add("node");
    array.add(NODE_NAME);

    String output;
    serializeJson(doc, output);

    socketIO.send(sIOtype_CONNECT, "/");
    socketIO.sendEVENT(output);
    break;
  }
  case sIOtype_EVENT:
  {
    // [DEBUG] Permite debuggear los datos (payload) que trae el evento
    // USE_SERIAL.printf("[IOc] get event: %s\n", payload);
    // payload --> ["event", "value", "aux", ...]

    const char *str = (const char *)payload;

    JsonDocument doc;

    deserializeJson(doc, str);

    JsonArray array = doc.as<JsonArray>();

    const char *event = array[0].as<const char *>();
    const char *value = array[1].as<const char *>();
    const char *destination = array[2].as<const char *>();

    // [DEBUG] Permite debuggear los elementos que trae el arreglo (array) del evento
    // for(JsonVariant v : array) {
    //     Serial.println(v.as<const char*>());
    // }

    handleWebSocketConnection(event, value, destination);

    break;
  }
  case sIOtype_ACK:
    USE_SERIAL.printf("[IOc] get ack: %u\n", length);
    hexdump(payload, length);
    break;
  case sIOtype_ERROR:
    USE_SERIAL.printf("[IOc] get error: %u\n", length);
    hexdump(payload, length);
    break;
  case sIOtype_BINARY_EVENT:
    USE_SERIAL.printf("[IOc] get binary: %u\n", length);
    hexdump(payload, length);
    break;
  case sIOtype_BINARY_ACK:
    USE_SERIAL.printf("[IOc] get binary ack: %u\n", length);
    hexdump(payload, length);
    break;
  }
}

void setup()
{
  USE_SERIAL.begin(115200);

  USE_SERIAL.setDebugOutput(true);

  USE_SERIAL.println();
  USE_SERIAL.println();
  USE_SERIAL.println();

  for (uint8_t t = 4; t > 0; t--)
  {
    USE_SERIAL.printf("[SETUP] BOOT WAIT %d...\n", t);
    USE_SERIAL.flush();
    delay(1000);
  }

  // Establecen los pines del motor como salida
  // pinMode(MOTOR_PIN_1, OUTPUT);
  // pinMode(MOTOR_PIN_2, OUTPUT);
  // pinMode(MOTOR_PIN_3, OUTPUT);
  // pinMode(MOTOR_PIN_4, OUTPUT);

  motor.setMaxSpeed(MOTOR_SPEED);
  motor.setAcceleration(200);
  motor.moveTo(STEPS_PER_REV);

  // [feat] Agregar pines de los botones y los leds de control del motor
  // ---

  if (WiFi.getMode() & WIFI_AP)
  {
    WiFi.softAPdisconnect(true);
  }

  WiFiMulti.addAP(SSID, PASSWORD);

  while (WiFiMulti.run() != WL_CONNECTED)
  {
    delay(100);
  }

  String ip = WiFi.localIP().toString();
  USE_SERIAL.printf("[SETUP] WiFi Connected %s\n", ip.c_str());

  socketIO.begin(SERVER_URL, SERVER_PORT, "/socket.io/?EIO=4");

  socketIO.onEvent(socketIOEvent);
}

unsigned long messageTimestamp = 0;

void loop()
{
  unsigned long currentTime = micros();

  socketIO.loop();

  // [feat] Agregar función que permita manejar el motor de forma local
  // ---

  if (connectedToServer)
  {

    // [tmp] Por el momento, el motor se puede controlar unicamente de manera remota
    if (strcmp(plantControl, "remote") == 0)
    {
      // Esto permite convertir código síncrono en asíncrono
      if ((currentTime - lastMotorActionTimestamp) >= motorActionInterval)
      {
        handleMotor();
      }
    }

    // Según el intervalo de muestreo establecido, el nodo lee e envia datos al servidor a través del evento "analog-read"
    if ((currentTime - lastAnalogPinReadTime) >= sendAnalogDataInterval)
    {
      int A0Value = analogRead(A0);

      JsonDocument doc;
      JsonArray array = doc.to<JsonArray>();

      String response = String(A0Value);

      array.add("analog-read");
      array.add(response);

      String output;
      serializeJson(doc, output);

      socketIO.sendEVENT(output);

      lastAnalogPinReadTime = currentTime;
    }
  }
}

void handleWebSocketConnection(const char *event, const char *value, const char *destination)
{
  if (strcmp(event, "ping") != 0)
  {
    Serial.print("Evento: ");
    Serial.println(event);
    Serial.print("Valor: ");
    Serial.println(value);
  }

  if (event != NULL && value != NULL)
  {

    // [EVENT] Permite establecer o cambiar el modo de funcionamiento de la planta ("local" o "remote")
    if (strcmp(event, "plant-control") == 0)
    {
      // Por seguridad, si el dato que se recibe es distinto de "local" o de "remote", la planta se establecerá en modo remoto automáticamente
      plantControl = strcmp(value, "local") == 0 ? "local" : "remote";

      JsonDocument doc;
      JsonArray array = doc.to<JsonArray>();

      array.add("plant-control-fb");

      JsonObject payload = array.createNestedObject();
      payload["control"] = plantControl;
      payload["node"] = NODE_NAME;

      String output;
      serializeJson(doc, output);

      socketIO.sendEVENT(output);
      Serial.println(plantControl);
    }

    // [EVENT] Permite establecer o cambiar el estado del motor ("on" o "off")
    if (strcmp(event, "motor-state") == 0)
    {
      motorStatus = strcmp(value, "on") == 0 ? true : false;
    }

    // [EVENT] Permite establecer o cambiar el sentido de giro del motor ("clockwise" o "anticlockwise")
    if (strcmp(event, "motor-direction") == 0)
    {
      motorDirection = strcmp(value, "clockwise") == 0 ? "clockwise" : "anticlockwise";
    }

    // [EVENT] Permite enviar al servidor los valores que poseen las variables de la planta ("plantControl", "motorState")
    if (strcmp(event, "variables-states") == 0)
    {
      JsonDocument doc;
      JsonArray array = doc.to<JsonArray>();

      array.add("variables-states");

      JsonObject payload = array.createNestedObject();
      payload["clientSocketId"] = value;
      payload["plantControl"] = plantControl;
      payload["motorState"] = motorStatus ? "on" : "off";
      payload["motorDirection"] = motorDirection;

      String output;
      serializeJson(doc, output);

      socketIO.sendEVENT(output);
    }
  }
}

void handleMotor()
{
  if (motorStatus)
  {
    if (strcmp(motorDirection, "clockwise") == 0)
    {
      motor.setSpeed(150);
      motor.runSpeed();
      // clockwise();
    }
    else
    {
      motor.setSpeed(-150);
      motor.runSpeed();
      // anticlockwise();
    }
  }
}

String parseBooleanToString(bool variable)
{
  if (variable)
  {
    return "true";
  }
  else
  {
    return "false";
  }
}

// void clockwise()
// {
//   stepCounter++;
//   if (stepCounter >= numSteps)
//     stepCounter = 0;
//   setOutput(stepCounter);
// }

// void anticlockwise()
// {
//   stepCounter--;
//   if (stepCounter < 0)
//     stepCounter = numSteps - 1;
//   setOutput(stepCounter);
// }

// void setOutput(int step)
// {
//   digitalWrite(MOTOR_PIN_1, bitRead(stepsLookup[step], 0));
//   digitalWrite(MOTOR_PIN_2, bitRead(stepsLookup[step], 1));
//   digitalWrite(MOTOR_PIN_3, bitRead(stepsLookup[step], 2));
//   digitalWrite(MOTOR_PIN_4, bitRead(stepsLookup[step], 3));
// }
