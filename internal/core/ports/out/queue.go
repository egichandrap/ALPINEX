package out

import (
	"context"
	"time"
)

type ExecutionTask struct {
	ExecutionID string
	EnqueuedAt  time.Time
}

type ExecutionQueue interface {
	Enqueue(ctx context.Context, task ExecutionTask) error
	Dequeue(ctx context.Context, timeout time.Duration) (*ExecutionTask, error)
}

type RealtimeBroadcaster interface {
	BroadcastMetric(executionID string, sample MetricSample)
	BroadcastStatus(executionID string, status string)
	BroadcastLog(executionID string, timestamp time.Time, level, message string)
}
