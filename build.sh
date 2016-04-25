#!/bin/sh
set -e

./bootstrap.sh

go fmt
go vet *.go
go vet flatnet/*.go
go build
