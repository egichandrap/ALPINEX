.PHONY: all build test clean run-api run-worker run-web docker-up docker-down lint

# Variables
GO ?= go
NPM ?= npm

all: build

build: build-api build-worker build-cli build-web

build-api:
	@echo "Building API server..."
	$(GO) build -o bin/alpinex-api cmd/api/main.go

build-worker:
	@echo "Building Execution worker..."
	$(GO) build -o bin/alpinex-worker cmd/worker/main.go

build-cli:
	@echo "Building CLI binary..."
	$(GO) build -o bin/alpinex cmd/cli/main.go

build-web:
	@echo "Building Web UI..."
	cd web && $(NPM) install && $(NPM) run build

test:
	@echo "Running backend unit tests (TDD)..."
	$(GO) test -v -race ./internal/...

test-coverage:
	@echo "Running tests with coverage..."
	$(GO) test -v -coverprofile=coverage.out ./internal/...
	$(GO) tool cover -func=coverage.out

lint:
	@echo "Running Go linter..."
	golangci-lint run ./... || true

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	rm -rf bin/ coverage.out web/dist/
