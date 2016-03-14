#!/bin/sh

set -e

if [ -z "$GOPATH" ] ; then
  echo "You need to set your gopath".
  exit 1
fi

echo "Starting server on localhost:8080"
exec go run main.go --listen localhost:8080 --dummy "$@"
