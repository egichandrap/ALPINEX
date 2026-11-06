package in

import (
	"context"

	"github.com/alpinex/alpinex/internal/core/domain/iam"
	"github.com/alpinex/alpinex/internal/core/domain/workspace"
)

type RegisterUserInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	User         *iam.User `json:"user"`
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
}

type AuthUseCase interface {
	Register(ctx context.Context, input RegisterUserInput) (*AuthResponse, error)
	Login(ctx context.Context, input LoginInput) (*AuthResponse, error)
	GetProfile(ctx context.Context, userID string) (*iam.User, error)
}

type CreateOrgInput struct {
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	OwnerUserID string `json:"owner_user_id"`
}

type CreateWorkspaceInput struct {
	OrganizationID string `json:"organization_id"`
	Name           string `json:"name"`
	Description    string `json:"description"`
}

type CreateProjectInput struct {
	WorkspaceID string `json:"workspace_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type WorkspaceUseCase interface {
	CreateOrganization(ctx context.Context, input CreateOrgInput) (*workspace.Organization, error)
	CreateWorkspace(ctx context.Context, input CreateWorkspaceInput) (*workspace.Workspace, error)
	CreateProject(ctx context.Context, input CreateProjectInput) (*workspace.Project, error)
	ListProjects(ctx context.Context, workspaceID string) ([]*workspace.Project, error)
}
