package memory

import (
	"context"
	"errors"
	"sync"

	"github.com/alpinex/alpinex/internal/core/domain/api"
	"github.com/alpinex/alpinex/internal/core/domain/environment"
	"github.com/alpinex/alpinex/internal/core/domain/execution"
	"github.com/alpinex/alpinex/internal/core/domain/functional"
	"github.com/alpinex/alpinex/internal/core/domain/iam"
	"github.com/alpinex/alpinex/internal/core/domain/performance"
	"github.com/alpinex/alpinex/internal/core/domain/workspace"
)

var ErrNotFound = errors.New("entity not found")

type MemoryRepository struct {
	mu           sync.RWMutex
	users        map[string]*iam.User
	usersByEmail map[string]*iam.User
	orgs         map[string]*workspace.Organization
	workspaces   map[string]*workspace.Workspace
	projects     map[string]*workspace.Project
	environments map[string]*environment.Environment
	collections  map[string]*api.Collection
	requests     map[string]*api.APIRequest
	suites       map[string]*functional.TestSuite
	perfTests    map[string]*performance.PerformanceTest
	executions   map[string]*execution.Execution
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		users:        make(map[string]*iam.User),
		usersByEmail: make(map[string]*iam.User),
		orgs:         make(map[string]*workspace.Organization),
		workspaces:   make(map[string]*workspace.Workspace),
		projects:     make(map[string]*workspace.Project),
		environments: make(map[string]*environment.Environment),
		collections:  make(map[string]*api.Collection),
		requests:     make(map[string]*api.APIRequest),
		suites:       make(map[string]*functional.TestSuite),
		perfTests:    make(map[string]*performance.PerformanceTest),
		executions:   make(map[string]*execution.Execution),
	}
}

// User Repo
func (m *MemoryRepository) SaveUser(ctx context.Context, user *iam.User) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.users[user.ID] = user
	m.usersByEmail[user.Email] = user
	return nil
}

func (m *MemoryRepository) FindUserByID(ctx context.Context, id string) (*iam.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if u, ok := m.users[id]; ok {
		return u, nil
	}
	return nil, ErrNotFound
}

func (m *MemoryRepository) FindUserByEmail(ctx context.Context, email string) (*iam.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if u, ok := m.usersByEmail[email]; ok {
		return u, nil
	}
	return nil, ErrNotFound
}

// Workspace Repo
func (m *MemoryRepository) SaveOrganization(ctx context.Context, org *workspace.Organization) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.orgs[org.ID] = org
	return nil
}

func (m *MemoryRepository) FindOrgByID(ctx context.Context, id string) (*workspace.Organization, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if o, ok := m.orgs[id]; ok {
		return o, nil
	}
	return nil, ErrNotFound
}

func (m *MemoryRepository) SaveWorkspace(ctx context.Context, ws *workspace.Workspace) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.workspaces[ws.ID] = ws
	return nil
}

func (m *MemoryRepository) FindWorkspaceByID(ctx context.Context, id string) (*workspace.Workspace, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if w, ok := m.workspaces[id]; ok {
		return w, nil
	}
	return nil, ErrNotFound
}

func (m *MemoryRepository) ListWorkspacesByOrg(ctx context.Context, orgID string) ([]*workspace.Workspace, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	res := make([]*workspace.Workspace, 0)
	for _, w := range m.workspaces {
		if w.OrganizationID == orgID {
			res = append(res, w)
		}
	}
	return res, nil
}

func (m *MemoryRepository) SaveProject(ctx context.Context, proj *workspace.Project) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.projects[proj.ID] = proj
	return nil
}

func (m *MemoryRepository) FindProjectByID(ctx context.Context, id string) (*workspace.Project, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if p, ok := m.projects[id]; ok {
		return p, nil
	}
	return nil, ErrNotFound
}

func (m *MemoryRepository) ListProjectsByWorkspace(ctx context.Context, wsID string) ([]*workspace.Project, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	res := make([]*workspace.Project, 0)
	for _, p := range m.projects {
		if p.WorkspaceID == wsID {
			res = append(res, p)
		}
	}
	return res, nil
}

// Environment Repo
func (m *MemoryRepository) SaveEnvironment(ctx context.Context, env *environment.Environment) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.environments[env.ID] = env
	return nil
}

func (m *MemoryRepository) FindEnvironmentByID(ctx context.Context, id string) (*environment.Environment, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if e, ok := m.environments[id]; ok {
		return e, nil
	}
	return nil, ErrNotFound
}

func (m *MemoryRepository) ListEnvironmentsByProject(ctx context.Context, projectID string) ([]*environment.Environment, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	res := make([]*environment.Environment, 0)
	for _, e := range m.environments {
		if e.ProjectID == projectID {
			res = append(res, e)
		}
	}
	return res, nil
}

// Collection Repo
func (m *MemoryRepository) SaveCollection(ctx context.Context, col *api.Collection) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.collections[col.ID] = col
	return nil
}

func (m *MemoryRepository) FindCollectionByID(ctx context.Context, id string) (*api.Collection, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if c, ok := m.collections[id]; ok {
		return c, nil
	}
	return nil, ErrNotFound
}

func (m *MemoryRepository) ListCollectionsByProject(ctx context.Context, projectID string) ([]*api.Collection, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	res := make([]*api.Collection, 0)
	for _, c := range m.collections {
		if c.ProjectID == projectID {
			res = append(res, c)
		}
	}
	return res, nil
}

func (m *MemoryRepository) SaveRequest(ctx context.Context, colID string, req *api.APIRequest) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.requests[req.ID] = req
	if c, ok := m.collections[colID]; ok {
		c.AddRequest(req)
	}
	return nil
}

func (m *MemoryRepository) FindRequestByID(ctx context.Context, id string) (*api.APIRequest, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if r, ok := m.requests[id]; ok {
		return r, nil
	}
	return nil, ErrNotFound
}

// Functional & Performance Repos
func (m *MemoryRepository) SaveSuite(ctx context.Context, suite *functional.TestSuite) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.suites[suite.ID] = suite
	return nil
}

func (m *MemoryRepository) FindSuiteByID(ctx context.Context, id string) (*functional.TestSuite, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if s, ok := m.suites[id]; ok {
		return s, nil
	}
	return nil, ErrNotFound
}

func (m *MemoryRepository) ListSuitesByProject(ctx context.Context, projectID string) ([]*functional.TestSuite, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	res := make([]*functional.TestSuite, 0)
	for _, s := range m.suites {
		if s.ProjectID == projectID {
			res = append(res, s)
		}
	}
	return res, nil
}

func (m *MemoryRepository) SaveTest(ctx context.Context, test *performance.PerformanceTest) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.perfTests[test.ID] = test
	return nil
}

func (m *MemoryRepository) FindTestByID(ctx context.Context, id string) (*performance.PerformanceTest, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if t, ok := m.perfTests[id]; ok {
		return t, nil
	}
	return nil, ErrNotFound
}

func (m *MemoryRepository) ListTestsByProject(ctx context.Context, projectID string) ([]*performance.PerformanceTest, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	res := make([]*performance.PerformanceTest, 0)
	for _, t := range m.perfTests {
		if t.ProjectID == projectID {
			res = append(res, t)
		}
	}
	return res, nil
}

// Execution Repo
func (m *MemoryRepository) SaveExecution(ctx context.Context, exec *execution.Execution) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.executions[exec.ID] = exec
	return nil
}

func (m *MemoryRepository) FindExecutionByID(ctx context.Context, id string) (*execution.Execution, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if e, ok := m.executions[id]; ok {
		return e, nil
	}
	return nil, ErrNotFound
}

func (m *MemoryRepository) ListExecutionsByProject(ctx context.Context, projectID string, limit, offset int) ([]*execution.Execution, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	res := make([]*execution.Execution, 0)
	for _, e := range m.executions {
		if e.ProjectID == projectID {
			res = append(res, e)
		}
	}
	return res, nil
}
