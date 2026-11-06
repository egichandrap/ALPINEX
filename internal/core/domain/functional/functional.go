package functional

import (
	"errors"
	"strings"
	"time"
)

var (
	ErrEmptySuiteName = errors.New("test suite name cannot be empty")
	ErrEmptyCaseName  = errors.New("test case name cannot be empty")
)

type AssertionSource string

const (
	SourceStatus       AssertionSource = "STATUS"
	SourceResponseTime AssertionSource = "RESPONSE_TIME"
	SourceHeader       AssertionSource = "HEADER"
	SourceJSONPath     AssertionSource = "JSON_PATH"
	SourceBody         AssertionSource = "BODY"
)

type AssertionOperator string

const (
	OpEquals       AssertionOperator = "EQUALS"
	OpNotEquals    AssertionOperator = "NOT_EQUALS"
	OpLessThan     AssertionOperator = "LESS_THAN"
	OpGreaterThan  AssertionOperator = "GREATER_THAN"
	OpContains     AssertionOperator = "CONTAINS"
	OpNotContains  AssertionOperator = "NOT_CONTAINS"
	OpExists       AssertionOperator = "EXISTS"
	OpRegexMatch   AssertionOperator = "REGEX_MATCH"
)

// Assertion defines a declarative check on an HTTP response.
type Assertion struct {
	ID           string
	Source       AssertionSource
	Operator     AssertionOperator
	TargetValue  string
	PropertyPath string // For Header name or JSONPath (e.g. $.data.id)
}

// VariableExtraction extracts data from a response to pass into subsequent requests (Chaining).
type VariableExtraction struct {
	VariableName string // Target variable name e.g. "auth_token"
	Source       AssertionSource
	PropertyPath string // e.g. "$.token"
}

// TestCase represents an individual executable test step referencing an API Request.
type TestCase struct {
	ID          string
	RequestID   string
	Name        string
	Position    int
	Assertions  []Assertion
	Extractions []VariableExtraction
}

// TestSuite is an Aggregate Root grouping ordered test cases.
type TestSuite struct {
	ID            string
	ProjectID     string
	Name          string
	Description   string
	StopOnFailure bool
	Cases         []TestCase
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func NewTestSuite(id, projectID, name, description string, stopOnFailure bool) (*TestSuite, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, ErrEmptySuiteName
	}

	now := time.Now().UTC()
	return &TestSuite{
		ID:            id,
		ProjectID:     projectID,
		Name:          name,
		Description:   description,
		StopOnFailure: stopOnFailure,
		Cases:         make([]TestCase, 0),
		CreatedAt:     now,
		UpdatedAt:     now,
	}, nil
}

func (s *TestSuite) AddCase(c TestCase) {
	s.Cases = append(s.Cases, c)
	s.UpdatedAt = time.Now().UTC()
}
