package services

import (
	"context"

	"github.com/alpinex/alpinex/internal/core/domain/workspace"
	"github.com/alpinex/alpinex/internal/core/ports/in"
	"github.com/alpinex/alpinex/internal/core/ports/out"
	"github.com/google/uuid"
)

type WorkspaceService struct {
	repo out.WorkspaceRepository
}

func NewWorkspaceService(repo out.WorkspaceRepository) *WorkspaceService {
	return &WorkspaceService{repo: repo}
}

func (s *WorkspaceService) CreateOrganization(ctx context.Context, input in.CreateOrgInput) (*workspace.Organization, error) {
	orgID := uuid.NewString()
	org, err := workspace.NewOrganization(orgID, input.Name, input.Slug, input.OwnerUserID)
	if err != nil {
		return nil, err
	}

	if err := s.repo.SaveOrganization(ctx, org); err != nil {
		return nil, err
	}
	return org, nil
}

func (s *WorkspaceService) CreateWorkspace(ctx context.Context, input in.CreateWorkspaceInput) (*workspace.Workspace, error) {
	wsID := uuid.NewString()
	ws, err := workspace.NewWorkspace(wsID, input.OrganizationID, input.Name, input.Description)
	if err != nil {
		return nil, err
	}

	if err := s.repo.SaveWorkspace(ctx, ws); err != nil {
		return nil, err
	}
	return ws, nil
}

func (s *WorkspaceService) CreateProject(ctx context.Context, input in.CreateProjectInput) (*workspace.Project, error) {
	projID := uuid.NewString()
	proj, err := workspace.NewProject(projID, input.WorkspaceID, input.Name, input.Description)
	if err != nil {
		return nil, err
	}

	if err := s.repo.SaveProject(ctx, proj); err != nil {
		return nil, err
	}
	return proj, nil
}

func (s *WorkspaceService) ListProjects(ctx context.Context, workspaceID string) ([]*workspace.Project, error) {
	return s.repo.ListProjectsByWorkspace(ctx, workspaceID)
}

func (s *WorkspaceService) DeleteProject(ctx context.Context, projectID string) error {
	return s.repo.DeleteProject(ctx, projectID)
}
