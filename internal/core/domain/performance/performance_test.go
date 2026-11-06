package performance_test

import (
	"testing"

	"github.com/alpinex/alpinex/internal/core/domain/performance"
)

func TestNewPerformanceTest_Validation(t *testing.T) {
	// Empty name
	_, err := performance.NewPerformanceTest("pt-1", "p-1", "", performance.TypeLoad, performance.WorkloadProfile{
		Model: performance.ModelConstantVUs,
		VUs:   100,
	})
	if err != performance.ErrEmptyTestName {
		t.Fatalf("expected ErrEmptyTestName, got %v", err)
	}

	// Zero VUs
	_, err = performance.NewPerformanceTest("pt-1", "p-1", "Load Test", performance.TypeLoad, performance.WorkloadProfile{
		Model: performance.ModelConstantVUs,
		VUs:   0,
	})
	if err != performance.ErrZeroVUs {
		t.Fatalf("expected ErrZeroVUs, got %v", err)
	}

	// Ramping without stages
	_, err = performance.NewPerformanceTest("pt-1", "p-1", "Ramp Test", performance.TypeStress, performance.WorkloadProfile{
		Model:  performance.ModelRampingVUs,
		Stages: []performance.Stage{},
	})
	if err != performance.ErrEmptyStages {
		t.Fatalf("expected ErrEmptyStages, got %v", err)
	}

	// Valid test
	pt, err := performance.NewPerformanceTest("pt-1", "p-1", "Checkout Stress Test", performance.TypeStress, performance.WorkloadProfile{
		Model: performance.ModelRampingVUs,
		Stages: []performance.Stage{
			{Duration: "2m", Target: 50},
			{Duration: "5m", Target: 200},
			{Duration: "1m", Target: 0},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	err = pt.AddThreshold("http_req_duration", []string{"p(95)<500", "p(99)<1000"})
	if err != nil {
		t.Fatalf("failed to add threshold: %v", err)
	}

	if len(pt.Thresholds) != 1 || pt.Thresholds[0].Metric != "http_req_duration" {
		t.Fatalf("unexpected thresholds: %v", pt.Thresholds)
	}
}
