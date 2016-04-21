package flatnet

import (
  "github.com/gorilla/websocket"
  "encoding/json"
  "log"
)

type Broadcaster interface {
  Broadcast(message []byte)

  BroadcastObject(message interface{}) error
}

type Hub struct {
  // write to this channel to publish a message
  broadcast   chan []byte

  // all the currently registered connections
  connections map[*hubConnection]bool

  // register requests
  register    chan *hubConnection

  // unregister requests
  unregister  chan *hubConnection
}

func NewHub() *Hub {
  return &Hub{
    broadcast:   make(chan []byte),
    register:    make(chan *hubConnection),
    unregister:  make(chan *hubConnection),
    connections: make(map[*hubConnection]bool),
  }
}

/**
 * Main loop for this hub. This method blocks forever, so it is best to
 * call it in a go-routine.
 */
func (h *Hub) MainLoop() {
  for {
    select {
    case conn := <-h.register:
      h.connections[conn] = true

    case conn := <-h.unregister:
      delete(h.connections, conn)
      close(conn.send)

    case message := <-h.broadcast:
      for conn := range h.connections {

        // send the message without blocking.
        // close the connection, if send queue is full.
        select {
        case conn.send <- message:
        default:
          delete(h.connections, conn)
          close(conn.send)
        }
      }
    }
  }
}

/**
 * Handles the given websocket connection. This call blocks
 * until the connection was closed.
 */
func (h *Hub) HandleConnection(socket *websocket.Conn) {

  // make a new connection object
  conn := &hubConnection{
    socket: socket,
    send: make(chan []byte, 256),
  }

  // register this connection with the hub
  h.register <- conn

  // forward writes and consume the read end too.
  go conn.writeLoop()
  conn.readLoop()

}

func (h *Hub) Broadcast(message []byte) {
  h.broadcast <- message
}

func (h *Hub) BroadcastObject(message interface{}) error {
  bytes, err := json.Marshal(message)
  if err == nil {
    log.Println("Broadcasting to clients:", message)
    h.Broadcast(bytes)
  }

  return err
}
