package main

import (
  "time"
  "fmt"
  "encoding/json"
  "math/rand"
)

func sendDummyTraffic(traffic chan <-[]byte, sourceLayer, sourceCount, targetLayer, targetCount int) {
  for _ = range time.Tick(500 * time.Millisecond) {

    source := fmt.Sprintf("node-%d", rand.Int() % sourceCount + 10 * sourceLayer)
    target := fmt.Sprintf("node-%d", rand.Int() % targetCount + 10 * targetLayer)

    message := TrafficMessage{
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
}
