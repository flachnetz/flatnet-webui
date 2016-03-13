package main

type Hub struct {
  // write to this channel to publish a message
  broadcast   chan []byte

  // all the currently registered connections
  connections map[*Connection]bool

  // register requests
  register    chan *Connection

  // unregister requests
  unregister  chan *Connection
}

func NewHub() *Hub {
  return &Hub{
    broadcast:   make(chan []byte),
    register:    make(chan *Connection),
    unregister:  make(chan *Connection),
    connections: make(map[*Connection]bool),
  }
}

func (h *Hub) run() {
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
