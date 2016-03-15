package flatnet

import (
  "time"
  "fmt"
  "math/rand"
)

func sendMapping(bc Broadcaster, layer int, format string) {
  for range time.Tick(2500 * time.Millisecond) {
    msg := Mapping{TypeMapping, make(map[string]string)}
    for idx := 0; idx < 10; idx++ {
      if rand.Float32() < 0.25 {
        name := fmt.Sprintf("node-%d", layer * 10 + idx)
        alias := fmt.Sprintf(format, idx + 1)
        msg.Mapping[name] = alias
      }
    }

    bc.BroadcastObject(msg)
  }
}

func sendDummyTraffic(bc Broadcaster, sourceLayer, sourceCount, targetLayer, targetCount int) {
  for range time.Tick(500 * time.Millisecond) {

    source := fmt.Sprintf("node-%d", rand.Int() % sourceCount + 10 * sourceLayer)
    target := fmt.Sprintf("node-%d", rand.Int() % targetCount + 10 * targetLayer)

    message := TrafficMessage{
      Type: TypeTraffic,
      Pings: []Ping{{source, target, rand.Int() % 3 + 1, 500}},
    }

    bc.BroadcastObject(message)
  }
}

func SetupDummyTraffic(bc Broadcaster) {
  const (
    LayerCS = 1
    LayerNginx = 2
    LayerGame = 3
    LayerDatabase = 4
    LayerKafka = 5
  )

  go sendDummyTraffic(bc, LayerCS, 4, LayerNginx, 2)
  go sendDummyTraffic(bc, LayerNginx, 2, LayerGame, 8)
  go sendDummyTraffic(bc, LayerGame, 8, LayerDatabase, 3)
  go sendDummyTraffic(bc, LayerDatabase, 3, LayerDatabase, 3)
  go sendDummyTraffic(bc, LayerKafka, 3, LayerKafka, 3)
  go sendDummyTraffic(bc, LayerCS, 4, LayerKafka, 3)
  go sendDummyTraffic(bc, LayerGame, 8, LayerKafka, 3)

  go sendMapping(bc, LayerCS, "cs-%02d")
  go sendMapping(bc, LayerNginx, "iwg-lb-%02d")
  go sendMapping(bc, LayerGame, "iwg-game-%02d")
  go sendMapping(bc, LayerDatabase, "iwg-cassandra-%02d")
  go sendMapping(bc, LayerKafka, "kafka-%02d")
}
