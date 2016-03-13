package flowly

type Ping struct {
  Source   string `json:"source"`
  Target   string `json:"target"`
  Count    int `json:"count"`
  Duration int `json:"duration"`
}

type TrafficMessage struct {
  Type  string `json:"type"`
  Pings []Ping `json:"pings"`
}

type Mapping struct {
  Type    string `json:"type"`
  Mapping map[string]string `json:"mapping"`
}

const (
  TypeTraffic = "traffic"
  TypeMapping = "mapping"
)
