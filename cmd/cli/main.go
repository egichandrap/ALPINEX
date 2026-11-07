package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"
)

const (
	ExitSuccess     = 0
	ExitTestFailed  = 1
	ExitConfigError = 2
	ExitInfraError  = 3
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(ExitConfigError)
	}

	command := os.Args[1]

	switch command {
	case "health":
		runHealthCmd()
	case "test", "run":
		runTestCmd(os.Args[2:])
	case "version":
		fmt.Printf("ALPINEX CLI v1.0.1 (%s/%s)\n", runtime.GOOS, runtime.GOARCH)
		os.Exit(ExitSuccess)
	default:
		fmt.Printf("Unknown command: %s\n\n", command)
		printUsage()
		os.Exit(ExitConfigError)
	}
}

func printUsage() {
	fmt.Println("Usage: alpinex <command> [flags]")
	fmt.Println("\nCommands:")
	fmt.Println("  health                 Check status of the ALPINEX API server")
	fmt.Println("  test, run              Execute an API functional or performance test")
	fmt.Println("  version                Show CLI version")
	fmt.Println("\nExamples:")
	fmt.Println("  alpinex health --url http://localhost:8080")
	fmt.Println("  alpinex run --target-id <suite-id> --type FUNCTIONAL")
}

func runHealthCmd() {
	url := "http://localhost:8080/health"
	if len(os.Args) > 2 && os.Args[2] != "" {
		url = os.Args[2]
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		fmt.Printf("❌ Connection error: %v\n", err)
		os.Exit(ExitInfraError)
	}
	defer func() { _ = resp.Body.Close() }()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == http.StatusOK {
		fmt.Printf("✅ ALPINEX API is Healthy: %s\n", strings.TrimSpace(string(body)))
		os.Exit(ExitSuccess)
	} else {
		fmt.Printf("⚠️ Healthcheck returned status %d: %s\n", resp.StatusCode, string(body))
		os.Exit(ExitTestFailed)
	}
}

func runTestCmd(args []string) {
	cmd := flag.NewFlagSet("run", flag.ExitOnError)
	apiURL := cmd.String("url", "http://localhost:8080", "ALPINEX API server URL")
	token := cmd.String("token", "", "Bearer JWT auth token")
	projID := cmd.String("project", "proj-sample", "Project ID")
	targetID := cmd.String("target-id", "suite-demo", "Test Suite or Performance Test ID")
	testType := cmd.String("type", "FUNCTIONAL", "Test Type (FUNCTIONAL or PERFORMANCE)")
	engine := cmd.String("engine", "NATIVE_HTTP", "Execution Engine (NATIVE_HTTP or K6)")

	_ = cmd.Parse(args)

	fmt.Printf("🎯 Triggering execution on %s (Project: %s, Type: %s, Engine: %s)...\n", *apiURL, *projID, *testType, *engine)

	payload := map[string]interface{}{
		"project_id":  *projID,
		"test_type":   *testType,
		"target_id":   *targetID,
		"engine_name": *engine,
	}
	bodyBytes, _ := json.Marshal(payload)

	req, err := http.NewRequest(http.MethodPost, *apiURL+"/api/v1/executions", strings.NewReader(string(bodyBytes)))
	if err != nil {
		fmt.Printf("Configuration error: %v\n", err)
		os.Exit(ExitConfigError)
	}

	req.Header.Set("Content-Type", "application/json")
	if *token != "" {
		req.Header.Set("Authorization", "Bearer "+*token)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ Failed to contact API server: %v\n", err)
		os.Exit(ExitInfraError)
	}
	defer func() { _ = resp.Body.Close() }()

	respBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == http.StatusAccepted || resp.StatusCode == http.StatusOK {
		fmt.Printf("✅ Execution Triggered: %s\n", string(respBytes))
		os.Exit(ExitSuccess)
	} else {
		fmt.Printf("❌ Execution failed with status %d: %s\n", resp.StatusCode, string(respBytes))
		os.Exit(ExitTestFailed)
	}
}
