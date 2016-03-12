package main

import (
  "os"
  "net/http"
  "github.com/gorilla/handlers"
  "github.com/gorilla/mux"
  "github.com/gorilla/websocket"
  "log"
)

type connection struct {
  socket *websocket.Conn
  send   chan []byte
}

func (conn *connection) pumpWrite() {
  defer conn.socket.Close()

  for message := range conn.send {
    // write the message to the socket
    if err := conn.socket.WriteMessage(websocket.TextMessage, message); err != nil {
      log.Print("Could not write message: ", err)
      break
    }
  }
}


/**
 * Reads all the messages of a websocket until it is closed.
 */
func (conn *connection) consume() {
  for {
    if _, _, err := conn.socket.NextReader(); err != nil {
      log.Println("Error reading websocket: ", err)
      conn.socket.Close()
      break
    }
  }
}

func handleWebSocket(hub *Hub, w http.ResponseWriter, req *http.Request) {
  socket, err := websocket.Upgrade(w, req, nil, 0, 0)
  if err != nil {
    log.Println("Could not upgrade to websocket: ", err)
    return
  }

  // make a new connection object
  conn := &connection{
    socket: socket,
    send: make(chan []byte, 256),
  }

  // register this connection with the hub
  hub.register <- conn

  go conn.pumpWrite()
  conn.consume()
}

type Edge struct {
  Source   string `json:"source"`
  Target   string `json:"target"`
  Count    int `json:"count"`
  Duration int `json:"duration"`
}

type TrafficMessage struct {
  Edges []Edge `json:"edges"`
}

func main() {
  // create the hub and start routing traffic.
  hub := NewHub()
  go hub.run()

  setupDummyTraffic(hub);

  router := mux.NewRouter()
  router.Path("/traffic").HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
    handleWebSocket(hub, w, req);
  })

  router.PathPrefix("/").Handler(http.FileServer(http.Dir("static")))

  panic(http.ListenAndServe(":8080",
    handlers.LoggingHandler(os.Stdout,
      handlers.RecoveryHandler()(router))));
}
