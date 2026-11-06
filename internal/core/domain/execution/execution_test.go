package execution_test

import (
	"testing"

	"github.com/alpinex/alpinex/internal/core/domain/execution"
)

func TestNewExecution_Validation(t *testing.T) {
	_, err := execution.NewExecution("", "proj-1", "PERFORMANCE", "test-1", "K6", "user-1")
	if err != execution.ErrEmptyExecutionID {
		t.Fatalf("expected ErrEmptyExecutionID, got %v", err)
	}

	_, err = execution.NewExecution("exec-1", "", "PERFORMANCE", "test-1", "K6", "user-1")
	if err != execution.ErrEmptyProjectID {
		t.Fatalf("expected ErrEmptyProjectID, got %v", err)
	}

	exec, err := execution.NewExecution("exec-1", "proj-1", "PERFORMANCE", "test-1", "K6", "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if exec.Status != execution.StatusDraft {
		t.Fatalf("expected status DRAFT, got %s", exec.Status)
	}
}

func TestExecution_LifecycleTransitions(t *testing.T) {
	exec, err := execution.NewExecution("exec-1", "proj-1", "PERFORMANCE", "test-1", "K6", "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Draft -> Queue
	if err := exec.Queue(); err != nil {
		t.Fatalf("failed to queue execution: %v", err)
	}
	if exec.Status != execution.StatusQueued {
		t.Fatalf("expected QUEUED, got %s", exec.Status)
	}

	// Queue -> Start
	if err := exec.Start(); err != nil {
		t.Fatalf("failed to start execution: %v", err)
	}
	if exec.Status != execution.StatusRunning {
		t.Fatalf("expected RUNNING, got %s", exec.Status)
	}
	if exec.StartedAt == nil {
		t.Fatalf("expected StartedAt to be set")
	}

	// Running -> Complete
	if err := exec.Complete(); err != nil {
		t.Fatalf("failed to complete execution: %v", err)
	}
	if exec.Status != execution.StatusCompleted {
		t.Fatalf("expected COMPLETED, got %s", exec.Status)
	}
	if exec.EndedAt == nil {
		t.Fatalf("expected EndedAt to be set")
	}

	// Invariant Check: Terminal state cannot transition back to Start
	if err := exec.Start(); err != execution.ErrExecutionAlreadyEnded {
		t.Fatalf("expected ErrExecutionAlreadyEnded, got %v", err)
	}
}

func TestExecution_CancelFromRunning(t *testing.T) {
	exec, _ := execution.NewExecution("exec-2", "proj-1", "FUNCTIONAL", "suite-1", "NATIVE_HTTP", "user-1")
	_ = exec.Queue()
	_ = exec.Start()

	if err := exec.Cancel(); err != nil {
		t.Fatalf("failed to cancel: %v", err)
	}
	if exec.Status != execution.StatusCancelled {
		t.Fatalf("expected CANCELLED, got %s", exec.Status)
	}
}
