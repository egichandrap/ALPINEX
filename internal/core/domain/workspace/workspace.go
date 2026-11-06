package workspace

import (
	"errors"
	"strings"
	"time"
)

var (
	ErrEmptyOrgName       = errors.New("organization name cannot be empty")
	ErrEmptyOrgSlug       = errors.New("organization slug cannot be empty")
	ErrEmptyWorkspaceName = errors.New("workspace name cannot be empty")
	ErrEmptyProjectName   = errors.New("project name cannot be empty")
	ErrMemberNotFound     = errors.New("member not found in organization or workspace")
)

type Role string

const (
	RoleOwner  Role = "OWNER"
	RoleAdmin  Role = "ADMIN"
	RoleMember Role = "MEMBER"
	RoleViewer Role = "VIEWER"
)

// Organization represents the top-level tenant.
type Organization struct {
	ID        string
	Name      string
	Slug      string
	Members   map[string]Role // userID -> Role
	CreatedAt time.Time
	UpdatedAt time.Time
}

func NewOrganization(id, name, slug, ownerUserID string) (*Organization, error) {
	name = strings.TrimSpace(name)
	slug = strings.ToLower(strings.TrimSpace(slug))

	if name == "" {
		return nil, ErrEmptyOrgName
	}
	if slug == "" {
		return nil, ErrEmptyOrgSlug
	}

	now := time.Now().UTC()
	org := &Organization{
		ID:        id,
		Name:      name,
		Slug:      slug,
		Members:   make(map[string]Role),
		CreatedAt: now,
		UpdatedAt: now,
	}

	if ownerUserID != "" {
		org.Members[ownerUserID] = RoleOwner
	}

	return org, nil
}

func (o *Organization) AddMember(userID string, role Role) {
	if o.Members == nil {
		o.Members = make(map[string]Role)
	}
	o.Members[userID] = role
	o.UpdatedAt = time.Now().UTC()
}

func (o *Organization) GetRole(userID string) (Role, bool) {
	role, exists := o.Members[userID]
	return role, exists
}

// Workspace groups projects within an organization.
type Workspace struct {
	ID             string
	OrganizationID string
	Name           string
	Description    string
	Members        map[string]Role // userID -> Role
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func NewWorkspace(id, orgID, name, description string) (*Workspace, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, ErrEmptyWorkspaceName
	}

	now := time.Now().UTC()
	return &Workspace{
		ID:             id,
		OrganizationID: orgID,
		Name:           name,
		Description:    description,
		Members:        make(map[string]Role),
		CreatedAt:      now,
		UpdatedAt:      now,
	}, nil
}

// Project is the testing namespace containing collections, environments, and tests.
type Project struct {
	ID          string
	WorkspaceID string
	Name        string
	Description string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func NewProject(id, workspaceID, name, description string) (*Project, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, ErrEmptyProjectName
	}

	now := time.Now().UTC()
	return &Project{
		ID:          id,
		WorkspaceID: workspaceID,
		Name:        name,
		Description: description,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}
