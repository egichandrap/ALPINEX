package native_http

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/alpinex/alpinex/internal/core/domain/functional"
)

type AssertionOutcome struct {
	Assertion functional.Assertion
	Passed    bool
	Actual    string
	Error     string
}

// EvaluateAssertion checks an assertion against an executed HTTP response.
func EvaluateAssertion(a functional.Assertion, statusCode int, duration time.Duration, headers map[string]string, body []byte) AssertionOutcome {
	outcome := AssertionOutcome{Assertion: a}

	switch a.Source {
	case functional.SourceStatus:
		outcome.Actual = strconv.Itoa(statusCode)
		expectedStatus, err := strconv.Atoi(a.TargetValue)
		if err != nil {
			outcome.Error = fmt.Sprintf("invalid target status: %s", a.TargetValue)
			return outcome
		}

		switch a.Operator {
		case functional.OpEquals:
			outcome.Passed = statusCode == expectedStatus
		case functional.OpNotEquals:
			outcome.Passed = statusCode != expectedStatus
		case functional.OpLessThan:
			outcome.Passed = statusCode < expectedStatus
		case functional.OpGreaterThan:
			outcome.Passed = statusCode > expectedStatus
		default:
			outcome.Error = fmt.Sprintf("unsupported operator %s for status", a.Operator)
		}

	case functional.SourceResponseTime:
		actualMs := duration.Milliseconds()
		outcome.Actual = fmt.Sprintf("%dms", actualMs)
		targetMs, err := strconv.ParseInt(strings.TrimSuffix(a.TargetValue, "ms"), 10, 64)
		if err != nil {
			outcome.Error = fmt.Sprintf("invalid target response time: %s", a.TargetValue)
			return outcome
		}

		switch a.Operator {
		case functional.OpLessThan:
			outcome.Passed = actualMs < targetMs
		case functional.OpGreaterThan:
			outcome.Passed = actualMs > targetMs
		default:
			outcome.Error = fmt.Sprintf("unsupported operator %s for response time", a.Operator)
		}

	case functional.SourceHeader:
		val, exists := headers[strings.ToLower(a.PropertyPath)]
		outcome.Actual = val

		switch a.Operator {
		case functional.OpExists:
			outcome.Passed = exists
		case functional.OpEquals:
			outcome.Passed = exists && val == a.TargetValue
		case functional.OpContains:
			outcome.Passed = exists && strings.Contains(val, a.TargetValue)
		default:
			outcome.Error = fmt.Sprintf("unsupported operator %s for header", a.Operator)
		}

	case functional.SourceBody:
		actualBody := string(body)
		outcome.Actual = actualBody
		switch a.Operator {
		case functional.OpContains:
			outcome.Passed = strings.Contains(actualBody, a.TargetValue)
		case functional.OpEquals:
			outcome.Passed = actualBody == a.TargetValue
		}

	case functional.SourceJSONPath:
		val, exists := extractJSONValue(body, a.PropertyPath)
		outcome.Actual = fmt.Sprintf("%v", val)

		switch a.Operator {
		case functional.OpExists:
			outcome.Passed = exists
		case functional.OpEquals:
			outcome.Passed = exists && fmt.Sprintf("%v", val) == a.TargetValue
		case functional.OpContains:
			outcome.Passed = exists && strings.Contains(fmt.Sprintf("%v", val), a.TargetValue)
		default:
			outcome.Error = fmt.Sprintf("unsupported operator %s for JSONPath", a.Operator)
		}
	}

	return outcome
}

// extractJSONValue traverses nested maps/slices using dot notation or $.path.
func extractJSONValue(body []byte, path string) (interface{}, bool) {
	var parsed interface{}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, false
	}

	path = strings.TrimPrefix(path, "$.")
	path = strings.TrimPrefix(path, "$")
	tokens := strings.Split(path, ".")

	current := parsed
	for _, token := range tokens {
		if token == "" {
			continue
		}

		switch node := current.(type) {
		case map[string]interface{}:
			val, exists := node[token]
			if !exists {
				return nil, false
			}
			current = val
		default:
			return nil, false
		}
	}

	return current, true
}
