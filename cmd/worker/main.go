package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/alpinex/alpinex/internal/adapters/engines/k6"
	"github.com/alpinex/alpinex/internal/adapters/engines/native_http"
	"github.com/alpinex/alpinex/internal/core/ports/out"
)

type ConsoleEmitter struct{}

func (e *ConsoleEmitter) EmitMetric(sample out.MetricSample) {
	log.Printf("[METRIC] VUs=%d RPS=%.1f LatencyAvg=%.1fms P95=%.1fms ErrorRate=%.3f",
		sample.VUs, sample.RPS, sample.LatencyAvg, sample.LatencyP95, sample.ErrorRate)
}

func (e *ConsoleEmitter) EmitLog(timestamp time.Time, level, message string) {
	log.Printf("[%s] %s", level, message)
}

func main() {
	workerID := fmt.Sprintf("worker-%d", time.Now().Unix())
	log.Printf("👷 Starting ALPINEX Execution Worker [%s]...", workerID)

	// Engines available
	httpRunner := native_http.NewNativeHTTPRunner(30 * time.Second)
	k6Runner := k6.NewRunner("k6")

	log.Printf("🔌 Available Engines: %s, %s", httpRunner.Name(), k6Runner.Name())

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	// Simulated Heartbeat Ticker
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case t := <-ticker.C:
				log.Printf("[HEARTBEAT] Worker %s healthy at %s (Active tasks: 0)", workerID, t.Format(time.RFC3339))
			}
		}
	}()

	log.Printf("✅ Worker ready and polling for tasks...")
	<-sigChan

	log.Println("Stopping worker gracefully...")
	cancel()
	time.Sleep(500 * time.Millisecond)
	log.Println("Worker exited.")
}
