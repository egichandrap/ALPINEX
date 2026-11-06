package functional_test

import (
	"testing"

	"github.com/alpinex/alpinex/internal/core/domain/functional"
)

func TestNewTestSuite(t *testing.T) {
	_, err := functional.NewTestSuite("s-1", "p-1", "", "desc", true)
	if err != functional.ErrEmptySuiteName {
		t.Fatalf("expected ErrEmptySuiteName, got %v", err)
	}

	suite, err := functional.NewTestSuite("s-1", "p-1", "Smoke Suite", "Sanity checks", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	testCase := functional.TestCase{
		ID:        "tc-1",
		RequestID: "req-1",
		Name:      "Step 1: Login",
		Position:  1,
		Assertions: []functional.Assertion{
			{
				ID:          "a-1",
				Source:      functional.SourceStatus,
				Operator:    functional.OpEquals,
				TargetValue: "200",
			},
			{
				ID:           "a-2",
				Source:       functional.SourceJSONPath,
				Operator:     functional.OpExists,
				PropertyPath: "$.token",
			},
		},
		Extractions: []functional.VariableExtraction{
			{
				VariableName: "auth_token",
				Source:       functional.SourceJSONPath,
				PropertyPath: "$.token",
			},
		},
	}

	suite.AddCase(testCase)
	if len(suite.Cases) != 1 {
		t.Fatalf("expected 1 test case, got %d", len(suite.Cases))
	}
	if len(suite.Cases[0].Assertions) != 2 {
		t.Fatalf("expected 2 assertions, got %d", len(suite.Cases[0].Assertions))
	}
	if suite.Cases[0].Extractions[0].VariableName != "auth_token" {
		t.Fatalf("expected extraction variable auth_token")
	}
}
