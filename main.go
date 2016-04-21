package main

import (
	"flag"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/oliverbestmann/flowly-ui/flatnet"
	"io/ioutil"
	"log"
	"net/http"
	"os"
)

func handleWebSocket(hub *flatnet.Hub, w http.ResponseWriter, req *http.Request) {
	socket, err := websocket.Upgrade(w, req, nil, 0, 0)
	if err != nil {
		log.Println("Could not upgrade to websocket: ", err)
		return
	}

	hub.HandleConnection(socket)
}

func handleHttpTrafficSource(hub *flatnet.Hub, w http.ResponseWriter, req *http.Request) {
	bytes, err := ioutil.ReadAll(req.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	hub.Broadcast(bytes)
	w.WriteHeader(http.StatusNoContent)
}

func main() {
	port := flag.String("listen", ":8080", "Address to use for creating the http server.")
	kafkaAddress := flag.String("kafka", "", "Address of kafka broker.")
	kafkaTopic := flag.String("kafka-topic", "flowly", "Name of the kafka topic to consume.")
	dummy := flag.Bool("dummy", false, "Generate dummy traffic")

	flag.Parse()

	// create the hub and start routing traffic.
	hub := flatnet.NewHub()
	go hub.MainLoop()

	if *dummy {
		log.Println("Starting dummy traffic generator")
		flatnet.SetupDummyTraffic(hub)
	}

	if *kafkaAddress != "" {
		if *kafkaTopic == "" {
			log.Fatalln("You need to specify --kafka-topic with --kafka-address")
		}

		flatnet.SetupKafkaTraffic(hub, *kafkaAddress, *kafkaTopic)
	}

	router := mux.NewRouter()
	router.Path("/traffic").Methods("GET").HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		handleWebSocket(hub, w, req)
	})

	router.Path("/traffic").Methods("POST").HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		handleHttpTrafficSource(hub, w, req)
	})

	router.PathPrefix("/").Handler(http.FileServer(http.Dir("static")))

	panic(http.ListenAndServe(*port,
		handlers.LoggingHandler(os.Stdout,
			handlers.RecoveryHandler()(router))))
}
