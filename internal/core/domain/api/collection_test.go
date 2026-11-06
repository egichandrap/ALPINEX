package api_test

import (
	"testing"

	"github.com/alpinex/alpinex/internal/core/domain/api"
)

func TestNewAPIRequest(t *testing.T) {
	_, err := api.NewAPIRequest("r-1", "", "GET", "https://api.example.com")
	if err != api.ErrEmptyRequestName {
		t.Fatalf("expected ErrEmptyRequestName, got %v", err)
	}

	_, err = api.NewAPIRequest("r-1", "Get Users", "INVALID_METHOD", "https://api.example.com")
	if err != api.ErrInvalidHTTPMethod {
		t.Fatalf("expected ErrInvalidHTTPMethod, got %v", err)
	}

	_, err = api.NewAPIRequest("r-1", "Get Users", "GET", "")
	if err != api.ErrEmptyURLTemplate {
		t.Fatalf("expected ErrEmptyURLTemplate, got %v", err)
	}

	req, err := api.NewAPIRequest("r-1", "Get Users", "get", "https://api.example.com/v1/users")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if req.Method != "GET" {
		t.Fatalf("expected method normalized to uppercase GET, got %s", req.Method)
	}
	if req.TimeoutMs != 30000 {
		t.Fatalf("expected default timeout 30000ms, got %d", req.TimeoutMs)
	}
}

func TestCollection_Hierarchy(t *testing.T) {
	col, err := api.NewCollection("col-1", "p-1", "User Service", "User endpoints")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	folder := &api.Folder{ID: "f-1", Name: "Authentication"}
	col.AddFolder(folder)

	req, _ := api.NewAPIRequest("r-1", "Login", "POST", "https://api.example.com/v1/auth/login")
	req.FolderID = &folder.ID
	col.AddRequest(req)

	if len(col.Folders) != 1 || col.Folders["f-1"].Name != "Authentication" {
		t.Fatalf("expected 1 folder with name Authentication")
	}
	if len(col.Requests) != 1 || col.Requests["r-1"].Name != "Login" {
		t.Fatalf("expected 1 request with name Login")
	}
}
