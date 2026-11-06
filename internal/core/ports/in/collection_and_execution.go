package in

import (
	"context"

	"github.com/alpinex/alpinex/internal/core/domain/api"
	"github.com/alpinex/alpinex/internal/core/domain/execution"
	"github.com/alpinex/alpinex/internal/core/domain/functional"
	"github.com/alpinex/alpinex/internal/core/domain/performance"
)

type CreateCollectionInput struct {
	ProjectID   string `json:"project_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type CreateRequestInput struct {
	CollectionID string          `json:"collection_id"`
	FolderID     *string         `json:"folder_id"`
	Name         string          `json:"name"`
	Method       string          `json:"method"`
	URLTemplate  string          `json:"url_template"`
	Headers      []api.Header    `json:"headers"`
	QueryParams  []api.QueryParam `json:"query_params"`
	BodyType     api.BodyType    `json:"body_type"`
	BodyContent  string          `json:"body_content"`
	AuthConfig   api.AuthConfig  `json:"auth_config"`
	TimeoutMs    int             `json:"timeout_ms"`
}

type CollectionUseCase interface {
	CreateCollection(ctx context.Context, input CreateCollectionInput) (*api.Collection, error)
	GetCollection(ctx context.Context, colID string) (*api.Collection, error)
	ListCollections(ctx context.Context, projectID string) ([]*api.Collection, error)
	CreateRequest(ctx context.Context, input CreateRequestInput) (*api.APIRequest, error)
	GetRequest(ctx context.Context, reqID string) (*api.APIRequest, error)
}

type TriggerExecutionInput struct {
	ProjectID     string  `json:"project_id"`
	TestType      string  `json:"test_type"` // "FUNCTIONAL" or "PERFORMANCE"
	TargetID      string  `json:"target_id"` // SuiteID or PerformanceTestID
	EnvironmentID *string `json:"environment_id"`
	TriggeredBy   string  `json:"triggered_by"`
	EngineName    string  `json:"engine_name"` // "NATIVE_HTTP" or "K6"
}

type ExecutionUseCase interface {
	TriggerExecution(ctx context.Context, input TriggerExecutionInput) (*execution.Execution, error)
	GetExecution(ctx context.Context, execID string) (*execution.Execution, error)
	StopExecution(ctx context.Context, execID string, userID string) error
	CreateTestSuite(ctx context.Context, suite *functional.TestSuite) (*functional.TestSuite, error)
	CreatePerformanceTest(ctx context.Context, test *performance.PerformanceTest) (*performance.PerformanceTest, error)
}
