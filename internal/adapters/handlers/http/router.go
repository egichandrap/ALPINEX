package http

import (
	"net/http"

	"github.com/alpinex/alpinex/internal/core/ports/out"
)

// NewRouter sets up the entire HTTP routing multiplexer with Clean Architecture separation.
func NewRouter(h *Handler, tokenService out.TokenService) http.Handler {
	mux := http.NewServeMux()

	// Public Routes
	mux.HandleFunc("GET /health", h.HandleHealth)
	mux.HandleFunc("POST /api/v1/auth/register", h.HandleRegister)
	mux.HandleFunc("POST /api/v1/auth/login", h.HandleLogin)

	// Protected Routes
	protectedMux := http.NewServeMux()
	protectedMux.HandleFunc("GET /api/v1/auth/me", h.HandleGetMe)

	// Organizations & Workspaces
	protectedMux.HandleFunc("POST /api/v1/organizations", h.HandleCreateOrg)
	protectedMux.HandleFunc("POST /api/v1/workspaces", h.HandleCreateWorkspace)
	protectedMux.HandleFunc("POST /api/v1/projects", h.HandleCreateProject)
	protectedMux.HandleFunc("GET /api/v1/workspaces/{wsId}/projects", h.HandleListProjects)

	// Collections & Requests
	protectedMux.HandleFunc("POST /api/v1/projects/{projId}/collections", h.HandleCreateCollection)
	protectedMux.HandleFunc("GET /api/v1/projects/{projId}/collections", h.HandleListCollections)
	protectedMux.HandleFunc("POST /api/v1/collections/{colId}/requests", h.HandleCreateRequest)

	// Functional & Performance Tests
	protectedMux.HandleFunc("POST /api/v1/projects/{projId}/test-suites", h.HandleCreateTestSuite)
	protectedMux.HandleFunc("POST /api/v1/projects/{projId}/performance-tests", h.HandleCreatePerformanceTest)

	// Executions
	protectedMux.HandleFunc("POST /api/v1/executions", h.HandleTriggerExecution)
	protectedMux.HandleFunc("GET /api/v1/executions/{id}", h.HandleGetExecution)
	protectedMux.HandleFunc("POST /api/v1/executions/{id}/stop", h.HandleStopExecution)

	// Attach protected routes behind AuthMiddleware
	authMiddleware := AuthMiddleware(tokenService)
	mux.Handle("/", authMiddleware(protectedMux))

	// Wrap in global CORS & Logging Middleware
	return CORSMiddleware(LoggingMiddleware(mux))
}
