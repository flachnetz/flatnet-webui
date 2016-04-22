package flatnet

import (
	"bytes"
	"encoding/json"
	"log"
	"strings"

	"github.com/shopify/sarama"
)

type kafkaEndpoint struct {
	Name string
	IP   string
	Port int
}

type kafkaPing struct {
	// Start time of capture
	Timestamp uint64

	// Source of this package
	Source kafkaEndpoint

	// Target of this package
	Target kafkaEndpoint `json:"Destination"`

	Len      int
	Packages int
}

type kafkaMessage struct {
	Timestamp uint64
	Duration  uint32      `json:"DurationInMillis"`
	Pings     []kafkaPing `json:"ServicePackages"`
}

func (ep *kafkaEndpoint) ToNodeId() string {
	ip := strings.Replace(ep.IP, ".", "_", -1)
	// return fmt.Sprintf("%s--%d", ip, ep.Port)
	return ip
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

			if bytes.Contains(message.Value, []byte(`"Source"`)) {
				content := kafkaMessage{}
				if err := json.Unmarshal(message.Value, &content); err != nil {
					log.Println("Could not parse message:", err)
					continue
				}

				var pings []Ping
				mappings := make(map[string]string)
				for _, kafkaPing := range content.Pings {
					if kafkaPing.Source.IP == "" || kafkaPing.Target.IP == "" {
						log.Println("No source or target ip.")
						continue
					}

					if kafkaPing.Len == 0 {
						log.Println("Packet has no length.")
						continue
					}

					pings = append(pings, Ping{
						Source:   kafkaPing.Source.ToNodeId(),
						Target:   kafkaPing.Target.ToNodeId(),
						Duration: int(content.Duration),
						Count:    kafkaPing.Len,
					})

					mappings[kafkaPing.Source.ToNodeId()] = kafkaPing.Source.Name
					mappings[kafkaPing.Target.ToNodeId()] = kafkaPing.Target.Name
				}

				log.Println("Broadcast ping via hub")
				bc.BroadcastObject(TrafficMessage{TypeTraffic, pings})

				if len(mappings) > 0 {
					bc.BroadcastObject(Mapping{TypeMapping, mappings})
				}
			}
		}
	}()
}
