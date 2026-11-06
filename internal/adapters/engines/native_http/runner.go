package native_http

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/alpinex/alpinex/internal/core/domain/environment"
	"github.com/alpinex/alpinex/internal/core/domain/functional"
	"github.com/alpinex/alpinex/internal/core/ports/out"
)

type NativeHTTPRunner struct {
	client *http.Client
}

func NewNativeHTTPRunner(timeout time.Duration) *NativeHTTPRunner {
	return &NativeHTTPRunner{
		client: &http.Client{Timeout: timeout},
	}
}

func (r *NativeHTTPRunner) Name() string {
	return "NATIVE_HTTP"
}

func (r *NativeHTTPRunner) Capabilities() out.EngineCapabilities {
	return out.EngineCapabilities{
		SupportedProtocols:  []string{"HTTP/1.1", "HTTP/2", "REST"},
		SupportedWorkloads:  []string{"single-shot", "sequential-suite"},
		SupportsLiveMetrics: true,
	}
}

func (r *NativeHTTPRunner) Execute(ctx context.Context, input out.ExecutionInput, emitter out.MetricEmitter) error {
	resolver := environment.NewVariableResolver()
	if input.ResolvedVariables != nil {
		resolver.PushScope(input.ResolvedVariables)
	}

	chainedVariables := make(map[string]string)
	resolver.PushScope(chainedVariables)

	if input.FunctionalSuite != nil {
		for idx, testCase := range input.FunctionalSuite.Cases {
			select {
			case <-ctx.Done():
				emitter.EmitLog(time.Now(), "WARN", "Execution cancelled by context")
				return ctx.Err()
			default:
			}

			reqSpec := input.RequestLookup[testCase.RequestID]
			if reqSpec == nil {
				emitter.EmitLog(time.Now(), "ERROR", fmt.Sprintf("Request ID %s not found in lookup", testCase.RequestID))
				if input.FunctionalSuite.StopOnFailure {
					return fmt.Errorf("request %s not found", testCase.RequestID)
				}
				continue
			}

			emitter.EmitLog(time.Now(), "INFO", fmt.Sprintf("[%d/%d] Executing step: %s", idx+1, len(input.FunctionalSuite.Cases), testCase.Name))

			// Interpolate URL, Headers, and Body
			resolvedURL := resolver.Interpolate(reqSpec.URLTemplate)
			var bodyReader io.Reader
			if reqSpec.BodyContent != "" {
				resolvedBody := resolver.Interpolate(reqSpec.BodyContent)
				bodyReader = bytes.NewBufferString(resolvedBody)
			}

			httpReq, err := http.NewRequestWithContext(ctx, reqSpec.Method, resolvedURL, bodyReader)
			if err != nil {
				emitter.EmitLog(time.Now(), "ERROR", fmt.Sprintf("Failed to construct request: %v", err))
				if input.FunctionalSuite.StopOnFailure {
					return err
				}
				continue
			}

			for _, h := range reqSpec.Headers {
				if h.Enabled {
					httpReq.Header.Set(h.Key, resolver.Interpolate(h.Value))
				}
			}

			start := time.Now()
			resp, err := r.client.Do(httpReq)
			duration := time.Since(start)

			if err != nil {
				emitter.EmitLog(time.Now(), "ERROR", fmt.Sprintf("Request execution failed: %v", err))
				if input.FunctionalSuite.StopOnFailure {
					return err
				}
				continue
			}

			respBody, _ := io.ReadAll(resp.Body)
			_ = resp.Body.Close()

			headerMap := make(map[string]string)
			for k, v := range resp.Header {
				headerMap[strings.ToLower(k)] = strings.Join(v, ", ")
			}

			// Evaluate Assertions
			allPassed := true
			for _, a := range testCase.Assertions {
				outcome := EvaluateAssertion(a, resp.StatusCode, duration, headerMap, respBody)
				if !outcome.Passed {
					allPassed = false
					emitter.EmitLog(time.Now(), "WARN", fmt.Sprintf("Assertion failed: source=%s operator=%s target=%s actual=%s", a.Source, a.Operator, a.TargetValue, outcome.Actual))
				} else {
					emitter.EmitLog(time.Now(), "INFO", fmt.Sprintf("Assertion passed: source=%s operator=%s target=%s", a.Source, a.Operator, a.TargetValue))
				}
			}

			// Extract chained variables
			for _, ext := range testCase.Extractions {
				if ext.Source == functional.SourceJSONPath {
					if val, ok := extractJSONValue(respBody, ext.PropertyPath); ok {
						valStr := fmt.Sprintf("%v", val)
						chainedVariables[ext.VariableName] = valStr
						emitter.EmitLog(time.Now(), "INFO", fmt.Sprintf("Extracted chained variable: %s = %s", ext.VariableName, valStr))
					}
				}
			}

			// Emit metric sample
			errorRate := 0.0
			if !allPassed || resp.StatusCode >= 400 {
				errorRate = 1.0
			}

			emitter.EmitMetric(out.MetricSample{
				Timestamp:   time.Now(),
				VUs:         1,
				RPS:         1.0,
				LatencyAvg:  float64(duration.Milliseconds()),
				LatencyP95:  float64(duration.Milliseconds()),
				ErrorRate:   errorRate,
				StatusCodes: map[int]int{resp.StatusCode: 1},
			})

			if !allPassed && input.FunctionalSuite.StopOnFailure {
				emitter.EmitLog(time.Now(), "ERROR", "Step failed and StopOnFailure is enabled; aborting suite")
				return fmt.Errorf("step %s failed assertions", testCase.Name)
			}
		}
	}

	return nil
}

func (r *NativeHTTPRunner) Stop(ctx context.Context, executionID string) error {
	return nil // Managed by context cancellation
}
