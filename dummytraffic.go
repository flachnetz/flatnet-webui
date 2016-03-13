package main

import (
  "time"
  "fmt"
  "encoding/json"
  "math/rand"
)

type Edge struct {
  Source   string `json:"source"`
  Target   string `json:"target"`
  Count    int `json:"count"`
  Duration int `json:"duration"`
}

type TrafficMessage struct {
  Type  string `json:"type"`
  Edges []Edge `json:"edges"`
}

type Mapping struct {
  Type    string `json:"type"`
  Mapping map[string]string `json:"mapping"`
}

func sendMapping(traffic chan <- []byte, layer int, format string) {
  msg := Mapping{"mapping", make(map[string]string)}
  for idx := 0; idx < 10; idx++ {
    name := fmt.Sprintf("node-%d", layer * 10 + idx)
    alias := fmt.Sprintf(format, idx + 1)
    msg.Mapping[name] = alias
  }

  for range time.Tick(5000 * time.Millisecond) {
    if encoded, err := json.Marshal(&msg); err == nil {
      traffic <- encoded
    }
  }
}

func sendDummyTraffic(traffic chan <-[]byte, sourceLayer, sourceCount, targetLayer, targetCount int) {
  for range time.Tick(500 * time.Millisecond) {

    source := fmt.Sprintf("node-%d", rand.Int() % sourceCount + 10 * sourceLayer)
    target := fmt.Sprintf("node-%d", rand.Int() % targetCount + 10 * targetLayer)

    message := TrafficMessage{
      Type: "traffic",
      Edges: []Edge{{source, target, rand.Int() % 3 + 1, 500}},
    }

    if encoded, err := json.Marshal(&message); err == nil {
      traffic <- encoded
    }
  }
}

func setupDummyTraffic(hub *Hub) {
  const (
    LayerCS = 1
    LayerNginx = 2
    LayerGame = 3
    LayerDatabase = 4
    LayerKafka = 5
  )

  go sendDummyTraffic(hub.broadcast, LayerCS, 4, LayerNginx, 2)
  go sendDummyTraffic(hub.broadcast, LayerNginx, 2, LayerGame, 8)
  go sendDummyTraffic(hub.broadcast, LayerGame, 8, LayerDatabase, 3)
  go sendDummyTraffic(hub.broadcast, LayerDatabase, 3, LayerDatabase, 3)
  go sendDummyTraffic(hub.broadcast, LayerKafka, 3, LayerKafka, 3)
  go sendDummyTraffic(hub.broadcast, LayerCS, 4, LayerKafka, 3)
  go sendDummyTraffic(hub.broadcast, LayerGame, 8, LayerKafka, 3)

  go sendMapping(hub.broadcast, LayerCS, "cs-%02d")
  go sendMapping(hub.broadcast, LayerNginx, "iwg-lb-%02d")
  go sendMapping(hub.broadcast, LayerGame, "iwg-game-%02d")
  go sendMapping(hub.broadcast, LayerDatabase, "iwg-cassandra-%02d")
  go sendMapping(hub.broadcast, LayerKafka, "kafka-%02d")
}
