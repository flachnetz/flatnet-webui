package main

import (
  "os"
  "net/http"
  "github.com/gorilla/handlers"
  "github.com/gorilla/mux"
  "github.com/gorilla/websocket"
  "log"
  "flag"
  "github.com/oliverbestmann/flowly-ui/flowly"
)

func handleWebSocket(hub *flowly.Hub, w http.ResponseWriter, req *http.Request) {
  socket, err := websocket.Upgrade(w, req, nil, 0, 0)
  if err != nil {
    log.Println("Could not upgrade to websocket: ", err)
    return
  }

  hub.HandleConnection(socket)
}

func main() {
  port := flag.String("listen", ":8080", "Address to use for creating the http server.")
  kafkaAddress := flag.String("kafka", "", "Address of kafka broker.")
  kafkaTopic := flag.String("kafka-topic", "flowly", "Name of the kafka topic to consume.")
  dummy := flag.Bool("dummy", false, "Generate dummy traffic")

  flag.Parse()

  // create the hub and start routing traffic.
  hub := flowly.NewHub()
  go hub.MainLoop()

  if (*dummy) {
    log.Println("Starting dummy traffic generator");
    flowly.SetupDummyTraffic(hub);
  }

  if (*kafkaAddress != "") {
    if (*kafkaTopic == "") {
      log.Fatalln("You need to specify --kafka-topic with --kafka-address")
    }

    flowly.SetupKafkaTraffic(hub, *kafkaAddress, *kafkaTopic)
  }

  router := mux.NewRouter()
  router.Path("/traffic").HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
    handleWebSocket(hub, w, req);
  })

  router.PathPrefix("/").Handler(http.FileServer(http.Dir("static")))

  panic(http.ListenAndServe(*port,
    handlers.LoggingHandler(os.Stdout,
      handlers.RecoveryHandler()(router))));
}
