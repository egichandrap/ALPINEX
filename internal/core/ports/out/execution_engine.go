package out

import (
	"context"
	"time"

	"github.com/alpinex/alpinex/internal/core/domain/api"
	"github.com/alpinex/alpinex/internal/core/domain/functional"
	"github.com/alpinex/alpinex/internal/core/domain/performance"
)

type EngineCapabilities struct {
	SupportedProtocols  []string
	SupportedWorkloads  []string
	SupportsLiveMetrics bool
}

type ExecutionInput struct {
	ExecutionID       string
	ProjectID         string
	TestType          string // "FUNCTIONAL" or "PERFORMANCE"
	ResolvedVariables map[string]string
	SingleRequest     *api.APIRequest
	FunctionalSuite   *functional.TestSuite
	PerformanceTest   *performance.PerformanceTest
	RequestLookup     map[string]*api.APIRequest // For resolving request IDs in scenarios
}

type ExecutionHandle struct {
	ExecutionID string
	EngineName  string
	StartTime   time.Time
}

type MetricSample struct {
	Timestamp   time.Time
	VUs         int
	RPS         float64
	LatencyAvg  float64
	LatencyP50  float64
	LatencyP90  float64
	LatencyP95  float64
	LatencyP99  float64
	ErrorRate   float64
	StatusCodes map[int]int
}

type MetricEmitter interface {
	EmitMetric(sample MetricSample)
	EmitLog(timestamp time.Time, level, message string)
}

type ExecutionEngine interface {
	Name() string
	Capabilities() EngineCapabilities
	Execute(ctx context.Context, input ExecutionInput, emitter MetricEmitter) error
	Stop(ctx context.Context, executionID string) error
}
