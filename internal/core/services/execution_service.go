package services

import (
	"context"
	"errors"

	"github.com/alpinex/alpinex/internal/core/domain/execution"
	"github.com/alpinex/alpinex/internal/core/domain/functional"
	"github.com/alpinex/alpinex/internal/core/domain/performance"
	"github.com/alpinex/alpinex/internal/core/ports/in"
	"github.com/alpinex/alpinex/internal/core/ports/out"
	"github.com/google/uuid"
)

var (
	ErrExecutionNotFound = errors.New("execution not found")
	ErrTargetNotFound    = errors.New("execution target (suite or performance test) not found")
)

type ExecutionService struct {
	execRepo        out.ExecutionRepository
	functionalRepo  out.FunctionalRepository
	perfRepo        out.PerformanceRepository
	queue           out.ExecutionQueue
	broadcaster     out.RealtimeBroadcaster
}

func NewExecutionService(
	execRepo out.ExecutionRepository,
	functionalRepo out.FunctionalRepository,
	perfRepo out.PerformanceRepository,
	queue out.ExecutionQueue,
	broadcaster out.RealtimeBroadcaster,
) *ExecutionService {
	return &ExecutionService{
		execRepo:       execRepo,
		functionalRepo: functionalRepo,
		perfRepo:       perfRepo,
		queue:          queue,
		broadcaster:    broadcaster,
	}
}

func (s *ExecutionService) TriggerExecution(ctx context.Context, input in.TriggerExecutionInput) (*execution.Execution, error) {
	// Verify target exists
	if input.TestType == "FUNCTIONAL" {
		suite, err := s.functionalRepo.FindSuiteByID(ctx, input.TargetID)
		if err != nil || suite == nil {
			return nil, ErrTargetNotFound
		}
	} else if input.TestType == "PERFORMANCE" {
		test, err := s.perfRepo.FindTestByID(ctx, input.TargetID)
		if err != nil || test == nil {
			return nil, ErrTargetNotFound
		}
	}

	execID := uuid.NewString()
	exec, err := execution.NewExecution(execID, input.ProjectID, input.TestType, input.TargetID, input.EngineName, input.TriggeredBy)
	if err != nil {
		return nil, err
	}

	if err := exec.Queue(); err != nil {
		return nil, err
	}

	if err := s.execRepo.SaveExecution(ctx, exec); err != nil {
		return nil, err
	}

	if s.queue != nil {
		_ = s.queue.Enqueue(ctx, out.ExecutionTask{
			ExecutionID: execID,
			EnqueuedAt:  exec.CreatedAt,
		})
	}

	if s.broadcaster != nil {
		s.broadcaster.BroadcastStatus(execID, string(exec.Status))
	}

	return exec, nil
}

func (s *ExecutionService) GetExecution(ctx context.Context, execID string) (*execution.Execution, error) {
	exec, err := s.execRepo.FindExecutionByID(ctx, execID)
	if err != nil || exec == nil {
		return nil, ErrExecutionNotFound
	}
	return exec, nil
}

func (s *ExecutionService) StopExecution(ctx context.Context, execID string, userID string) error {
	exec, err := s.execRepo.FindExecutionByID(ctx, execID)
	if err != nil || exec == nil {
		return ErrExecutionNotFound
	}

	if err := exec.Cancel(); err != nil {
		return err
	}

	if err := s.execRepo.SaveExecution(ctx, exec); err != nil {
		return err
	}

	if s.broadcaster != nil {
		s.broadcaster.BroadcastStatus(execID, string(exec.Status))
	}
	return nil
}

func (s *ExecutionService) CreateTestSuite(ctx context.Context, suite *functional.TestSuite) (*functional.TestSuite, error) {
	if err := s.functionalRepo.SaveSuite(ctx, suite); err != nil {
		return nil, err
	}
	return suite, nil
}

func (s *ExecutionService) CreatePerformanceTest(ctx context.Context, test *performance.PerformanceTest) (*performance.PerformanceTest, error) {
	if err := s.perfRepo.SaveTest(ctx, test); err != nil {
		return nil, err
	}
	return test, nil
}
