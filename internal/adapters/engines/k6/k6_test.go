package k6_test

import (
	"strings"
	"testing"

	"github.com/alpinex/alpinex/internal/adapters/engines/k6"
	"github.com/alpinex/alpinex/internal/core/domain/api"
	"github.com/alpinex/alpinex/internal/core/domain/performance"
)

func TestGenerateK6Script_ConstantVUs(t *testing.T) {
	test, _ := performance.NewPerformanceTest("pt-1", "p-1", "Constant Load", performance.TypeLoad, performance.WorkloadProfile{
		Model:    performance.ModelConstantVUs,
		VUs:      50,
		Duration: "1m",
	})
	_ = test.AddThreshold("http_req_duration", []string{"p(95)<400"})

	req, _ := api.NewAPIRequest("r-1", "Healthcheck", "GET", "http://127.0.0.1:8080/health")
	requests := map[string]*api.APIRequest{"r-1": req}

	test.Scenarios = []performance.Scenario{
		{
			Name: "Health Check Scenario",
			Steps: []performance.ScenarioStep{
				{RequestID: "r-1", Name: "Ping", ThinkTime: "1s"},
			},
		},
	}

	script := k6.GenerateK6Script(test, requests, nil)

	if !strings.Contains(script, "vus: 50") {
		t.Fatalf("expected script to contain 'vus: 50', got:\n%s", script)
	}
	if !strings.Contains(script, "duration: '1m'") {
		t.Fatalf("expected script to contain duration 1m")
	}
	if !strings.Contains(script, "'http_req_duration': ['p(95)<400']") {
		t.Fatalf("expected threshold in script")
	}
	if !strings.Contains(script, "http.get('http://127.0.0.1:8080/health')") {
		t.Fatalf("expected target URL in script")
	}
}

func TestGenerateK6Script_RampingStages(t *testing.T) {
	test, _ := performance.NewPerformanceTest("pt-2", "p-1", "Ramping Stress", performance.TypeStress, performance.WorkloadProfile{
		Model: performance.ModelRampingVUs,
		Stages: []performance.Stage{
			{Duration: "30s", Target: 20},
			{Duration: "1m", Target: 100},
			{Duration: "15s", Target: 0},
		},
	})

	script := k6.GenerateK6Script(test, nil, nil)
	if !strings.Contains(script, "stages: [") || !strings.Contains(script, "target: 100") {
		t.Fatalf("expected stages in script, got:\n%s", script)
	}
}
