package out

import (
	"context"

	"github.com/alpinex/alpinex/internal/core/domain/api"
	"github.com/alpinex/alpinex/internal/core/domain/environment"
	"github.com/alpinex/alpinex/internal/core/domain/execution"
	"github.com/alpinex/alpinex/internal/core/domain/functional"
	"github.com/alpinex/alpinex/internal/core/domain/iam"
	"github.com/alpinex/alpinex/internal/core/domain/performance"
	"github.com/alpinex/alpinex/internal/core/domain/workspace"
)

type UserRepository interface {
	SaveUser(ctx context.Context, user *iam.User) error
	FindUserByID(ctx context.Context, id string) (*iam.User, error)
	FindUserByEmail(ctx context.Context, email string) (*iam.User, error)
}

type WorkspaceRepository interface {
	SaveOrganization(ctx context.Context, org *workspace.Organization) error
	FindOrgByID(ctx context.Context, id string) (*workspace.Organization, error)
	SaveWorkspace(ctx context.Context, ws *workspace.Workspace) error
	FindWorkspaceByID(ctx context.Context, id string) (*workspace.Workspace, error)
	ListWorkspacesByOrg(ctx context.Context, orgID string) ([]*workspace.Workspace, error)
	SaveProject(ctx context.Context, proj *workspace.Project) error
	FindProjectByID(ctx context.Context, id string) (*workspace.Project, error)
	ListProjectsByWorkspace(ctx context.Context, wsID string) ([]*workspace.Project, error)
	DeleteProject(ctx context.Context, id string) error
}

type EnvironmentRepository interface {
	SaveEnvironment(ctx context.Context, env *environment.Environment) error
	FindEnvironmentByID(ctx context.Context, id string) (*environment.Environment, error)
	ListEnvironmentsByProject(ctx context.Context, projectID string) ([]*environment.Environment, error)
}

type CollectionRepository interface {
	SaveCollection(ctx context.Context, col *api.Collection) error
	FindCollectionByID(ctx context.Context, id string) (*api.Collection, error)
	ListCollectionsByProject(ctx context.Context, projectID string) ([]*api.Collection, error)
	SaveRequest(ctx context.Context, colID string, req *api.APIRequest) error
	FindRequestByID(ctx context.Context, id string) (*api.APIRequest, error)
}

type FunctionalRepository interface {
	SaveSuite(ctx context.Context, suite *functional.TestSuite) error
	FindSuiteByID(ctx context.Context, id string) (*functional.TestSuite, error)
	ListSuitesByProject(ctx context.Context, projectID string) ([]*functional.TestSuite, error)
}

type PerformanceRepository interface {
	SaveTest(ctx context.Context, test *performance.PerformanceTest) error
	FindTestByID(ctx context.Context, id string) (*performance.PerformanceTest, error)
	ListTestsByProject(ctx context.Context, projectID string) ([]*performance.PerformanceTest, error)
}

type ExecutionRepository interface {
	SaveExecution(ctx context.Context, exec *execution.Execution) error
	FindExecutionByID(ctx context.Context, id string) (*execution.Execution, error)
	ListExecutionsByProject(ctx context.Context, projectID string, limit, offset int) ([]*execution.Execution, error)
}
