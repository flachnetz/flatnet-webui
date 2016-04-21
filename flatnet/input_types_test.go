package flatnet

import (
  "encoding/json"
  "testing"
)

func TestAddressJsonDecoder(t *testing.T) {
  address := Address{}
  err := json.Unmarshal([]byte("\"10.1.1.5:8080\""), &address)
  if err != nil {
    t.Error("Parsing with error", err)
  }

  if address.Ip != "10.1.1.5" {
    t.Error("Expected 10.1.1.5, got", address.Ip)
  }

  if address.Port != 8080 {
    t.Error("Expected 8080, got", address.Port)
  }
}

func TestAddressJsonEncoder(t *testing.T) {
  address := Address{"10.1.1.5", 8080}
  bytes, _ := json.Marshal(address)

  if string(bytes) != "10.1.1.5:8080" {
    t.Error("Expected \"10.1.1.5:8080\", but got", string(bytes))
  }
}
