package flatnet

import (
  "bytes"
  "fmt"
  "strconv"
  "errors"
)

type Address struct {
  Ip string
  Port uint16
}

type Capture struct {
  Source Address
  Target Address

  // number of bytes captured
  Bytes uint32
}

type CaptureGroup struct {
  // should be "capture" for capture groups.
  Type string

  // Start time of capture
  Start uint64

  // Length of capture in milliseconds
  Duration uint32

  // Packets in this capture group.
  Packets []Capture
}

func (a *Address) MarshalJSON() ([]byte, error) {
  return []byte(fmt.Sprintf("%s:%d", a.Ip, a.Port)), nil
}

func (a *Address) UnmarshalJSON(json []byte) error {
  idx := bytes.IndexByte(json, ':')
  if idx != -1 {
    port, err := strconv.Atoi(string(json[idx+1:len(json)-1]))
    a.Ip = string(json[1:idx])
    a.Port = uint16(port)
    return err
  } else {
    return errors.New("Colon not found in address")
  }
}
