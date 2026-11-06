package native_http_test

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/alpinex/alpinex/internal/adapters/engines/native_http"
	"github.com/alpinex/alpinex/internal/core/domain/api"
	"github.com/alpinex/alpinex/internal/core/domain/functional"
	"github.com/alpinex/alpinex/internal/core/ports/out"
)

type testEmitter struct {
	logs    []string
	metrics []out.MetricSample
}

func (e *testEmitter) EmitMetric(s out.MetricSample) {
	e.metrics = append(e.metrics, s)
}
func (e *testEmitter) EmitLog(t time.Time, level, message string) {
	e.logs = append(e.logs, fmt.Sprintf("[%s] %s", level, message))
}

func TestNativeHTTPRunner_ChainedExecution(t *testing.T) {
	// Setup mock target server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/login":
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"token": "jwt_session_token_xyz"}`))
		case "/api/user":
			authHeader := r.Header.Get("Authorization")
			if authHeader != "Bearer jwt_session_token_xyz" {
				w.WriteHeader(http.StatusUnauthorized)
				_, _ = w.Write([]byte(`{"error": "unauthorized"}`))
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id": 42, "name": "Jane Doe"}`))
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	// Define Requests
	req1, _ := api.NewAPIRequest("r-1", "Login", "POST", server.URL+"/api/login")
	req2, _ := api.NewAPIRequest("r-2", "Get User", "GET", server.URL+"/api/user")
	req2.Headers = []api.Header{
		{Key: "Authorization", Value: "Bearer {{auth_token}}", Enabled: true},
	}

	// Define Suite with Chaining
	suite, _ := functional.NewTestSuite("s-1", "p-1", "Chained User Flow", "tests login then profile", true)
	suite.AddCase(functional.TestCase{
		ID:        "tc-1",
		RequestID: "r-1",
		Name:      "Login Step",
		Assertions: []functional.Assertion{
			{Source: functional.SourceStatus, Operator: functional.OpEquals, TargetValue: "200"},
			{Source: functional.SourceJSONPath, Operator: functional.OpExists, PropertyPath: "$.token"},
		},
		Extractions: []functional.VariableExtraction{
			{VariableName: "auth_token", Source: functional.SourceJSONPath, PropertyPath: "$.token"},
		},
	})
	suite.AddCase(functional.TestCase{
		ID:        "tc-2",
		RequestID: "r-2",
		Name:      "Get Profile Step",
		Assertions: []functional.Assertion{
			{Source: functional.SourceStatus, Operator: functional.OpEquals, TargetValue: "200"},
			{Source: functional.SourceJSONPath, Operator: functional.OpEquals, TargetValue: "42", PropertyPath: "$.id"},
		},
	})

	runner := native_http.NewNativeHTTPRunner(5 * time.Second)
	emitter := &testEmitter{}

	input := out.ExecutionInput{
		ExecutionID:     "exec-test-1",
		ProjectID:       "p-1",
		TestType:        "FUNCTIONAL",
		FunctionalSuite: suite,
		RequestLookup: map[string]*api.APIRequest{
			"r-1": req1,
			"r-2": req2,
		},
	}

	err := runner.Execute(context.Background(), input, emitter)
	if err != nil {
		t.Fatalf("expected suite execution to succeed, got: %v", err)
	}

	if len(emitter.metrics) != 2 {
		t.Fatalf("expected 2 metric samples, got %d", len(emitter.metrics))
	}
	if emitter.metrics[1].ErrorRate != 0.0 {
		t.Fatalf("expected step 2 error rate to be 0.0, got %f", emitter.metrics[1].ErrorRate)
	}
}
