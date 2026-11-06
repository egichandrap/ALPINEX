package http_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	adapterHTTP "github.com/alpinex/alpinex/internal/adapters/handlers/http"
	"github.com/alpinex/alpinex/internal/adapters/persistence/memory"
	"github.com/alpinex/alpinex/internal/adapters/security"
	"github.com/alpinex/alpinex/internal/core/services"
)

func TestHTTPRouter_EndToEndAuthAndWorkspaceFlow(t *testing.T) {
	memRepo := memory.NewMemoryRepository()
	jwtSvc := security.NewJWTService("my-secure-jwt-signing-secret-32-chars-ok", 15*time.Minute, 24*time.Hour)

	authSvc := services.NewAuthService(memRepo, jwtSvc)
	wsSvc := services.NewWorkspaceService(memRepo)
	colSvc := services.NewCollectionService(memRepo)
	execSvc := services.NewExecutionService(memRepo, memRepo, memRepo, nil, nil)

	handler := adapterHTTP.NewHandler(authSvc, wsSvc, colSvc, execSvc)
	router := adapterHTTP.NewRouter(handler, jwtSvc)

	// 1. Health check
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from /health, got %d", rec.Code)
	}

	// 2. Register User
	registerPayload := map[string]string{
		"email":     "admin@alpinex.dev",
		"password":  "supersecret123",
		"full_name": "Platform Admin",
	}
	body, _ := json.Marshal(registerPayload)
	req = httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created from /api/v1/auth/register, got %d: %s", rec.Code, rec.Body.String())
	}

	var regResp struct {
		Data struct {
			AccessToken string `json:"access_token"`
		} `json:"data"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &regResp)
	token := regResp.Data.AccessToken
	if token == "" {
		t.Fatalf("expected access token in register response")
	}

	// 3. Access Protected Route /api/v1/auth/me without token (must fail 401)
	req = httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized, got %d", rec.Code)
	}

	// 4. Access Protected Route with valid token (must succeed 200)
	req = httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
	}
}
