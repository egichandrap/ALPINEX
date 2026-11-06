package execution

import (
	"errors"
	"time"
)

// Status represents the finite states in an Execution lifecycle.
type Status string

const (
	StatusDraft        Status = "DRAFT"
	StatusValidating   Status = "VALIDATING"
	StatusQueued       Status = "QUEUED"
	StatusProvisioning Status = "PROVISIONING"
	StatusRunning      Status = "RUNNING"
	StatusStopping     Status = "STOPPING"
	StatusCompleted    Status = "COMPLETED"
	StatusFailed       Status = "FAILED"
	StatusCancelled    Status = "CANCELLED"
	StatusTimeout      Status = "TIMEOUT"
)

var (
	ErrInvalidStateTransition = errors.New("invalid state transition")
	ErrExecutionAlreadyEnded  = errors.New("execution is already in a terminal state")
	ErrEmptyExecutionID       = errors.New("execution ID cannot be empty")
	ErrEmptyProjectID         = errors.New("project ID cannot be empty")
)

// IsTerminal checks if the status cannot change further.
func (s Status) IsTerminal() bool {
	return s == StatusCompleted || s == StatusFailed || s == StatusCancelled || s == StatusTimeout
}

// Execution is the Aggregate Root governing an individual test run lifecycle.
type Execution struct {
	ID          string
	ProjectID   string
	TestType    string // "FUNCTIONAL" or "PERFORMANCE"
	TargetID    string // test suite ID or performance test ID
	EngineName  string // "NATIVE_HTTP" or "K6"
	Status      Status
	TriggeredBy string
	StartedAt   *time.Time
	EndedAt     *time.Time
	CreatedAt   time.Time
}

// NewExecution instantiates a fresh Execution aggregate in DRAFT state.
func NewExecution(id, projectID, testType, targetID, engineName, triggeredBy string) (*Execution, error) {
	if id == "" {
		return nil, ErrEmptyExecutionID
	}
	if projectID == "" {
		return nil, ErrEmptyProjectID
	}

	return &Execution{
		ID:          id,
		ProjectID:   projectID,
		TestType:    testType,
		TargetID:    targetID,
		EngineName:  engineName,
		Status:      StatusDraft,
		TriggeredBy: triggeredBy,
		CreatedAt:   time.Now().UTC(),
	}, nil
}

// Queue transitions state from DRAFT/VALIDATING to QUEUED.
func (e *Execution) Queue() error {
	if e.Status.IsTerminal() {
		return ErrExecutionAlreadyEnded
	}
	if e.Status != StatusDraft && e.Status != StatusValidating {
		return ErrInvalidStateTransition
	}
	e.Status = StatusQueued
	return nil
}

// Start transitions state from QUEUED or PROVISIONING to RUNNING.
func (e *Execution) Start() error {
	if e.Status.IsTerminal() {
		return ErrExecutionAlreadyEnded
	}
	if e.Status != StatusQueued && e.Status != StatusProvisioning {
		return ErrInvalidStateTransition
	}
	e.Status = StatusRunning
	now := time.Now().UTC()
	e.StartedAt = &now
	return nil
}

// Complete transitions a RUNNING execution to COMPLETED.
func (e *Execution) Complete() error {
	if e.Status != StatusRunning && e.Status != StatusStopping {
		return ErrInvalidStateTransition
	}
	e.Status = StatusCompleted
	now := time.Now().UTC()
	e.EndedAt = &now
	return nil
}

// Cancel terminates an execution into CANCELLED.
func (e *Execution) Cancel() error {
	if e.Status.IsTerminal() {
		return ErrExecutionAlreadyEnded
	}
	e.Status = StatusCancelled
	now := time.Now().UTC()
	e.EndedAt = &now
	return nil
}

// Fail marks the execution as FAILED.
func (e *Execution) Fail() error {
	if e.Status.IsTerminal() {
		return ErrExecutionAlreadyEnded
	}
	e.Status = StatusFailed
	now := time.Now().UTC()
	e.EndedAt = &now
	return nil
}
