package services_test

import (
	"context"
	"errors"
	"testing"

	"github.com/alpinex/alpinex/internal/core/domain/execution"
	"github.com/alpinex/alpinex/internal/core/domain/functional"
	"github.com/alpinex/alpinex/internal/core/domain/iam"
	"github.com/alpinex/alpinex/internal/core/domain/performance"
	"github.com/alpinex/alpinex/internal/core/ports/in"
	"github.com/alpinex/alpinex/internal/core/ports/out"
	"github.com/alpinex/alpinex/internal/core/services"
)

// In-memory User Repo
type mockUserRepo struct {
	users map[string]*iam.User
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{users: make(map[string]*iam.User)}
}
func (m *mockUserRepo) SaveUser(ctx context.Context, u *iam.User) error {
	m.users[u.ID] = u
	return nil
}
func (m *mockUserRepo) FindUserByID(ctx context.Context, id string) (*iam.User, error) {
	if u, ok := m.users[id]; ok {
		return u, nil
	}
	return nil, errors.New("not found")
}
func (m *mockUserRepo) FindUserByEmail(ctx context.Context, email string) (*iam.User, error) {
	for _, u := range m.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, errors.New("not found")
}

// In-memory Token Service
type mockTokenService struct{}

func (m *mockTokenService) GenerateAccessToken(u *iam.User) (string, error) {
	return "mock-access-token-" + u.ID, nil
}
func (m *mockTokenService) GenerateRefreshToken(u *iam.User) (string, error) {
	return "mock-refresh-token-" + u.ID, nil
}
func (m *mockTokenService) ValidateToken(t string) (*out.TokenClaims, error) {
	return &out.TokenClaims{UserID: "u-1", Email: "test@example.com"}, nil
}

func TestAuthService_RegisterAndLogin(t *testing.T) {
	repo := newMockUserRepo()
	tokenSvc := &mockTokenService{}
	authSvc := services.NewAuthService(repo, tokenSvc)

	ctx := context.Background()
	resp, err := authSvc.Register(ctx, in.RegisterUserInput{
		Email:    "tester@alpinex.dev",
		Password: "password123",
		FullName: "Alpinex Tester",
	})
	if err != nil {
		t.Fatalf("unexpected error registering: %v", err)
	}
	if resp.AccessToken == "" || resp.RefreshToken == "" {
		t.Fatalf("expected non-empty tokens")
	}

	// Duplicate register should fail
	_, err = authSvc.Register(ctx, in.RegisterUserInput{
		Email:    "tester@alpinex.dev",
		Password: "password123",
		FullName: "Duplicate",
	})
	if err != services.ErrEmailAlreadyExists {
		t.Fatalf("expected ErrEmailAlreadyExists, got %v", err)
	}

	// Login with correct credentials
	loginResp, err := authSvc.Login(ctx, in.LoginInput{
		Email:    "tester@alpinex.dev",
		Password: "password123",
	})
	if err != nil {
		t.Fatalf("unexpected error on login: %v", err)
	}
	if loginResp.User.Email != "tester@alpinex.dev" {
		t.Fatalf("unexpected user email: %s", loginResp.User.Email)
	}
}

// Mock Exec Repos
type mockExecRepo struct {
	execs map[string]*execution.Execution
}

func (m *mockExecRepo) SaveExecution(ctx context.Context, e *execution.Execution) error {
	m.execs[e.ID] = e
	return nil
}
func (m *mockExecRepo) FindExecutionByID(ctx context.Context, id string) (*execution.Execution, error) {
	if e, ok := m.execs[id]; ok {
		return e, nil
	}
	return nil, errors.New("not found")
}
func (m *mockExecRepo) ListExecutionsByProject(ctx context.Context, projectID string, limit, offset int) ([]*execution.Execution, error) {
	return nil, nil
}

type mockFunctionalRepo struct {
	suites map[string]*functional.TestSuite
}

func (m *mockFunctionalRepo) SaveSuite(ctx context.Context, s *functional.TestSuite) error {
	m.suites[s.ID] = s
	return nil
}
func (m *mockFunctionalRepo) FindSuiteByID(ctx context.Context, id string) (*functional.TestSuite, error) {
	if s, ok := m.suites[id]; ok {
		return s, nil
	}
	return nil, errors.New("not found")
}
func (m *mockFunctionalRepo) ListSuitesByProject(ctx context.Context, projectID string) ([]*functional.TestSuite, error) {
	return nil, nil
}

type mockPerfRepo struct {
	tests map[string]*performance.PerformanceTest
}

func (m *mockPerfRepo) SaveTest(ctx context.Context, t *performance.PerformanceTest) error {
	m.tests[t.ID] = t
	return nil
}
func (m *mockPerfRepo) FindTestByID(ctx context.Context, id string) (*performance.PerformanceTest, error) {
	if t, ok := m.tests[id]; ok {
		return t, nil
	}
	return nil, errors.New("not found")
}
func (m *mockPerfRepo) ListTestsByProject(ctx context.Context, projectID string) ([]*performance.PerformanceTest, error) {
	return nil, nil
}

func TestExecutionService_TriggerAndStop(t *testing.T) {
	execRepo := &mockExecRepo{execs: make(map[string]*execution.Execution)}
	funcRepo := &mockFunctionalRepo{suites: make(map[string]*functional.TestSuite)}
	perfRepo := &mockPerfRepo{tests: make(map[string]*performance.PerformanceTest)}

	suite, _ := functional.NewTestSuite("suite-1", "p-1", "Smoke Suite", "desc", true)
	_ = funcRepo.SaveSuite(context.Background(), suite)

	execSvc := services.NewExecutionService(execRepo, funcRepo, perfRepo, nil, nil)
	ctx := context.Background()

	exec, err := execSvc.TriggerExecution(ctx, in.TriggerExecutionInput{
		ProjectID:   "p-1",
		TestType:    "FUNCTIONAL",
		TargetID:    "suite-1",
		TriggeredBy: "u-1",
		EngineName:  "NATIVE_HTTP",
	})
	if err != nil {
		t.Fatalf("unexpected error triggering execution: %v", err)
	}
	if exec.Status != execution.StatusQueued {
		t.Fatalf("expected QUEUED status, got %s", exec.Status)
	}

	// Stop execution
	err = execSvc.StopExecution(ctx, exec.ID, "u-1")
	if err != nil {
		t.Fatalf("unexpected error stopping execution: %v", err)
	}
	if exec.Status != execution.StatusCancelled {
		t.Fatalf("expected CANCELLED status, got %s", exec.Status)
	}
}
