package flatnet;

import (
  "log"
  "bytes"
  "strings"
  "github.com/shopify/sarama"
  "encoding/json"
)

type kafkaTrafficMessage struct {
  Pings []Ping `json:"packets"`
}

func SetupKafkaTraffic(bc Broadcaster, address, topic string) {
  // open a connection to kafka
  consumer, err := sarama.NewConsumer(strings.Split(address, ","), nil)
  if err != nil {
    log.Fatalln("Could not create kafka consumer:", err)
  }

  topics, err := consumer.Topics()
  if err != nil {
    log.Fatalln("Could not list topics", err)
  }

  log.Println("Topics on kafka:", topics)

  //start consuming the topic
  partitionConsumer, err := consumer.ConsumePartition(topic, 0, sarama.OffsetNewest)
  if err != nil {
    consumer.Close()
    log.Fatalln("Could not create partition consumer:", err)
  }

  go func() {
    defer consumer.Close()

    for message := range partitionConsumer.Messages() {
      log.Printf("Got message of size %d\n", len(message.Value))

      if (bytes.Contains(message.Value, []byte(`"packets"`))) {
        content := kafkaTrafficMessage{}
        if err := json.Unmarshal(message.Value, &content); err != nil {
          log.Println("Could not parse message:", err)
          continue
        }

        bc.BroadcastObject(TrafficMessage{TypeTraffic, content.Pings})
      }
    }
  }()
}
