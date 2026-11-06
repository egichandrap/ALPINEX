package k6

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"github.com/alpinex/alpinex/internal/core/ports/out"
)

type Runner struct {
	k6BinaryPath string
	tmpDir       string
	activeCmds   map[string]*exec.Cmd
	mu           sync.Mutex
}

func NewRunner(k6BinaryPath string) *Runner {
	if k6BinaryPath == "" {
		k6BinaryPath = "k6"
	}
	return &Runner{
		k6BinaryPath: k6BinaryPath,
		tmpDir:       os.TempDir(),
		activeCmds:   make(map[string]*exec.Cmd),
	}
}

func (r *Runner) Name() string {
	return "K6"
}

func (r *Runner) Capabilities() out.EngineCapabilities {
	return out.EngineCapabilities{
		SupportedProtocols:  []string{"HTTP/1.1", "HTTP/2", "REST", "WebSocket", "gRPC"},
		SupportedWorkloads:  []string{"constant-vus", "ramping-vus", "constant-arrival-rate"},
		SupportsLiveMetrics: true,
	}
}

// k6MetricPoint models a JSON metric row emitted by k6 (--out json).
type k6MetricPoint struct {
	Type   string                 `json:"type"`
	Metric string                 `json:"metric"`
	Data   map[string]interface{} `json:"data"`
}

func (r *Runner) Execute(ctx context.Context, input out.ExecutionInput, emitter out.MetricEmitter) error {
	if input.PerformanceTest == nil {
		return fmt.Errorf("performance test specification is required for k6 engine")
	}

	// Synthesize script
	script := GenerateK6Script(input.PerformanceTest, input.RequestLookup, input.ResolvedVariables)
	scriptFile := filepath.Join(r.tmpDir, fmt.Sprintf("k6_%s.js", input.ExecutionID))
	if err := os.WriteFile(scriptFile, []byte(script), 0600); err != nil {
		return fmt.Errorf("failed to write script: %w", err)
	}
	defer func() { _ = os.Remove(scriptFile) }()

	emitter.EmitLog(time.Now(), "INFO", fmt.Sprintf("Generated k6 script for test '%s' at %s", input.PerformanceTest.Name, scriptFile))

	// Prepare k6 subprocess
	cmd := exec.CommandContext(ctx, r.k6BinaryPath, "run", "--out", "json=-", scriptFile)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed to open stdout pipe: %w", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("failed to open stderr pipe: %w", err)
	}

	r.mu.Lock()
	r.activeCmds[input.ExecutionID] = cmd
	r.mu.Unlock()

	defer func() {
		r.mu.Lock()
		delete(r.activeCmds, input.ExecutionID)
		r.mu.Unlock()
	}()

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start k6 process: %w", err)
	}

	// Read stderr for general logs
	go func() {
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			emitter.EmitLog(time.Now(), "INFO", scanner.Text())
		}
	}()

	// Parse JSON metric points from stdout
	scanner := bufio.NewScanner(stdout)
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for scanner.Scan() {
		line := scanner.Bytes()
		var point k6MetricPoint
		if err := json.Unmarshal(line, &point); err != nil {
			continue
		}

		if point.Type == "Point" && point.Metric == "http_req_duration" {
			if val, ok := point.Data["value"].(float64); ok {
				emitter.EmitMetric(out.MetricSample{
					Timestamp:  time.Now(),
					VUs:        1,
					RPS:        1.0,
					LatencyAvg: val,
					LatencyP95: val,
					LatencyP99: val,
				})
			}
		}
	}

	if err := cmd.Wait(); err != nil {
		if ctx.Err() != nil {
			emitter.EmitLog(time.Now(), "WARN", "k6 execution cancelled by context")
			return ctx.Err()
		}
		emitter.EmitLog(time.Now(), "INFO", fmt.Sprintf("k6 process exited: %v", err))
	}

	return nil
}

func (r *Runner) Stop(ctx context.Context, executionID string) error {
	r.mu.Lock()
	cmd, exists := r.activeCmds[executionID]
	r.mu.Unlock()

	if exists && cmd != nil && cmd.Process != nil {
		return cmd.Process.Kill()
	}
	return nil
}
