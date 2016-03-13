package main

import (
  "os"
  "net/http"
  "github.com/gorilla/handlers"
  "github.com/gorilla/mux"
  "github.com/gorilla/websocket"
  "log"
)

func handleWebSocket(hub *Hub, w http.ResponseWriter, req *http.Request) {
  socket, err := websocket.Upgrade(w, req, nil, 0, 0)
  if err != nil {
    log.Println("Could not upgrade to websocket: ", err)
    return
  }

  // make a new connection object
  conn := &Connection{
    socket: socket,
    send: make(chan []byte, 256),
  }

  // register this connection with the hub
  hub.register <- conn

  // forward writes and consume the read end too.
  go conn.writeLoop()
  conn.readLoop()
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
