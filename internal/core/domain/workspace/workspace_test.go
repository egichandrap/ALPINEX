package workspace_test

import (
	"testing"

	"github.com/alpinex/alpinex/internal/core/domain/workspace"
)

func TestNewOrganization(t *testing.T) {
	_, err := workspace.NewOrganization("org-1", "", "my-org", "user-1")
	if err != workspace.ErrEmptyOrgName {
		t.Fatalf("expected ErrEmptyOrgName, got %v", err)
	}

	_, err = workspace.NewOrganization("org-1", "My Org", "", "user-1")
	if err != workspace.ErrEmptyOrgSlug {
		t.Fatalf("expected ErrEmptyOrgSlug, got %v", err)
	}

	org, err := workspace.NewOrganization("org-1", "My Org", "my-org", "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	role, exists := org.GetRole("user-1")
	if !exists || role != workspace.RoleOwner {
		t.Fatalf("expected user-1 to be OWNER, got exists=%v role=%s", exists, role)
	}

	org.AddMember("user-2", workspace.RoleAdmin)
	role2, exists2 := org.GetRole("user-2")
	if !exists2 || role2 != workspace.RoleAdmin {
		t.Fatalf("expected user-2 to be ADMIN, got %s", role2)
	}
}

func TestNewWorkspaceAndProject(t *testing.T) {
	_, err := workspace.NewWorkspace("ws-1", "org-1", "", "desc")
	if err != workspace.ErrEmptyWorkspaceName {
		t.Fatalf("expected ErrEmptyWorkspaceName, got %v", err)
	}

	ws, err := workspace.NewWorkspace("ws-1", "org-1", "Default Workspace", "description")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ws.Name != "Default Workspace" {
		t.Fatalf("unexpected workspace name: %s", ws.Name)
	}

	_, err = workspace.NewProject("p-1", "ws-1", "", "desc")
	if err != workspace.ErrEmptyProjectName {
		t.Fatalf("expected ErrEmptyProjectName, got %v", err)
	}

	p, err := workspace.NewProject("p-1", "ws-1", "Payment Service", "Payment API test suite")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if p.Name != "Payment Service" {
		t.Fatalf("unexpected project name: %s", p.Name)
	}
}
