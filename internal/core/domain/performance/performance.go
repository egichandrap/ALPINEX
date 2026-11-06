package performance

import (
	"errors"
	"strings"
	"time"
)

var (
	ErrEmptyTestName           = errors.New("performance test name cannot be empty")
	ErrInvalidWorkloadModel    = errors.New("invalid workload model")
	ErrZeroVUs                 = errors.New("virtual users must be greater than zero")
	ErrEmptyStages             = errors.New("ramping workload must have at least one stage")
	ErrInvalidThreshold        = errors.New("threshold expression cannot be empty")
)

type TestType string

const (
	TypeSmoke       TestType = "SMOKE"
	TypeLoad        TestType = "LOAD"
	TypeStress      TestType = "STRESS"
	TypeSpike       TestType = "SPIKE"
	TypeSoak        TestType = "SOAK"
	TypeBreakpoint  TestType = "BREAKPOINT"
)

type WorkloadModel string

const (
	ModelConstantVUs   WorkloadModel = "constant-vus"
	ModelRampingVUs    WorkloadModel = "ramping-vus"
	ModelArrivalRate   WorkloadModel = "constant-arrival-rate"
)

type Stage struct {
	Duration string // e.g. "2m", "30s"
	Target   int    // Target VUs
}

type WorkloadProfile struct {
	Model             WorkloadModel
	VUs               int           // for constant-vus
	Duration          string        // e.g. "5m"
	Stages            []Stage       // for ramping-vus
	Rate              int           // for arrival-rate
	TimeUnit          string        // e.g. "1s"
	PreAllocatedVUs   int           // for arrival-rate
	MaxVUs            int           // for arrival-rate
}

type ScenarioStep struct {
	RequestID  string
	Name       string
	ThinkTime  string // e.g. "1s"
	Weight     int    // execution weight percentage
}

type Scenario struct {
	Name  string
	Steps []ScenarioStep
}

// Threshold defines SLA rules like "p(95)<500" or "http_req_failed<0.01".
type Threshold struct {
	Metric     string   // e.g. "http_req_duration", "http_req_failed"
	Conditions []string // e.g. ["p(95)<500", "p(99)<1000"]
}

// PerformanceTest is an Aggregate Root governing a performance test configuration.
type PerformanceTest struct {
	ID              string
	ProjectID       string
	Name            string
	TestType        TestType
	Workload        WorkloadProfile
	Scenarios       []Scenario
	Thresholds      []Threshold
	CustomScript    string // Raw k6 JS if in custom script mode
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func NewPerformanceTest(id, projectID, name string, testType TestType, workload WorkloadProfile) (*PerformanceTest, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, ErrEmptyTestName
	}

	// Validate workload profile
	switch workload.Model {
	case ModelConstantVUs:
		if workload.VUs <= 0 {
			return nil, ErrZeroVUs
		}
	case ModelRampingVUs:
		if len(workload.Stages) == 0 {
			return nil, ErrEmptyStages
		}
	case ModelArrivalRate:
		if workload.Rate <= 0 {
			return nil, errors.New("arrival rate must be greater than zero")
		}
	default:
		return nil, ErrInvalidWorkloadModel
	}

	now := time.Now().UTC()
	return &PerformanceTest{
		ID:         id,
		ProjectID:  projectID,
		Name:       name,
		TestType:   testType,
		Workload:   workload,
		Scenarios:  make([]Scenario, 0),
		Thresholds: make([]Threshold, 0),
		CreatedAt:  now,
		UpdatedAt:  now,
	}, nil
}

func (p *PerformanceTest) AddThreshold(metric string, conditions []string) error {
	if metric == "" || len(conditions) == 0 {
		return ErrInvalidThreshold
	}
	p.Thresholds = append(p.Thresholds, Threshold{
		Metric:     metric,
		Conditions: conditions,
	})
	p.UpdatedAt = time.Now().UTC()
	return nil
}
