#!/usr/bin/env bash
cd ui
yarn install
yarn build

cd ..
rm bindata.go
go get -u github.com/go-bindata/go-bindata/...
go-bindata ui/dist

rm -rf dist
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o dist/linux -ldflags "-s -w" .
CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -o dist/macos -ldflags "-s -w" .
CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -o dist/macos-arm64 -ldflags "-s -w" .
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -o dist/windows.exe -ldflags "-s -w" .

upx dist/linux
upx dist/macos
upx dist/windows.exe

go mod tidy
