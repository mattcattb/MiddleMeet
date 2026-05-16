SHELL := /bin/bash

APP_NAME := api
CMD := ./cmd/api
BIN_DIR := bin
BIN := $(BIN_DIR)/$(APP_NAME)

.PHONY: help dev run build start test fmt vet tidy clean

help:
	@echo "Go backend commands:"
	@echo "  make dev     Run API with ../.env and .env loaded"
	@echo "  make run     Run API without loading env files"
	@echo "  make build   Build API binary into bin/api"
	@echo "  make start   Run built bin/api"
	@echo "  make test    Run Go tests"
	@echo "  make fmt     Format Go code"
	@echo "  make vet     Run go vet"
	@echo "  make tidy    Tidy go.mod/go.sum"
	@echo "  make clean   Remove build output"

dev:
	@set -a; \
	if [ -f ../.env ]; then source ../.env; fi; \
	if [ -f .env ]; then source .env; fi; \
	set +a; \
	go run $(CMD)

run:
	go run $(CMD)

build:
	@mkdir -p $(BIN_DIR)
	go build -o $(BIN) $(CMD)

start:
	$(BIN)

test:
	go test ./...

fmt:
	go fmt ./...

vet:
	go vet ./...

tidy:
	go mod tidy

clean:
	rm -rf $(BIN_DIR)
