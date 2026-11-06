package http

import (
	"encoding/json"
	"net/http"

	"github.com/alpinex/alpinex/internal/core/domain/functional"
	"github.com/alpinex/alpinex/internal/core/domain/performance"
	"github.com/alpinex/alpinex/internal/core/ports/in"
)

type Handler struct {
	authUseCase       in.AuthUseCase
	workspaceUseCase  in.WorkspaceUseCase
	collectionUseCase in.CollectionUseCase
	executionUseCase  in.ExecutionUseCase
}

func NewHandler(
	authUseCase in.AuthUseCase,
	workspaceUseCase in.WorkspaceUseCase,
	collectionUseCase in.CollectionUseCase,
	executionUseCase in.ExecutionUseCase,
) *Handler {
	return &Handler{
		authUseCase:       authUseCase,
		workspaceUseCase:  workspaceUseCase,
		collectionUseCase: collectionUseCase,
		executionUseCase:  executionUseCase,
	}
}

// Register Auth Handlers
func (h *Handler) HandleRegister(w http.ResponseWriter, r *http.Request) {
	var input in.RegisterUserInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		JSONError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request payload", err.Error())
		return
	}

	res, err := h.authUseCase.Register(r.Context(), input)
	if err != nil {
		JSONError(w, r, http.StatusBadRequest, "REGISTRATION_FAILED", err.Error(), nil)
		return
	}

	JSONResponse(w, r, http.StatusCreated, res)
}

func (h *Handler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var input in.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		JSONError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request payload", err.Error())
		return
	}

	res, err := h.authUseCase.Login(r.Context(), input)
	if err != nil {
		JSONError(w, r, http.StatusUnauthorized, "LOGIN_FAILED", err.Error(), nil)
		return
	}

	JSONResponse(w, r, http.StatusOK, res)
}

func (h *Handler) HandleGetMe(w http.ResponseWriter, r *http.Request) {
	claims := GetUserClaims(r.Context())
	if claims == nil {
		JSONError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthenticated", nil)
		return
	}

	user, err := h.authUseCase.GetProfile(r.Context(), claims.UserID)
	if err != nil {
		JSONError(w, r, http.StatusNotFound, "USER_NOT_FOUND", "User not found", nil)
		return
	}

	JSONResponse(w, r, http.StatusOK, user)
}

// Workspace & Project Handlers
func (h *Handler) HandleCreateOrg(w http.ResponseWriter, r *http.Request) {
	claims := GetUserClaims(r.Context())
	var input in.CreateOrgInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		JSONError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid payload", err.Error())
		return
	}
	if claims != nil {
		input.OwnerUserID = claims.UserID
	}

	org, err := h.workspaceUseCase.CreateOrganization(r.Context(), input)
	if err != nil {
		JSONError(w, r, http.StatusBadRequest, "CREATE_ORG_FAILED", err.Error(), nil)
		return
	}
	JSONResponse(w, r, http.StatusCreated, org)
}

func (h *Handler) HandleCreateWorkspace(w http.ResponseWriter, r *http.Request) {
	var input in.CreateWorkspaceInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		JSONError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid payload", err.Error())
		return
	}

	ws, err := h.workspaceUseCase.CreateWorkspace(r.Context(), input)
	if err != nil {
		JSONError(w, r, http.StatusBadRequest, "CREATE_WS_FAILED", err.Error(), nil)
		return
	}
	JSONResponse(w, r, http.StatusCreated, ws)
}

func (h *Handler) HandleCreateProject(w http.ResponseWriter, r *http.Request) {
	var input in.CreateProjectInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		JSONError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid payload", err.Error())
		return
	}

	proj, err := h.workspaceUseCase.CreateProject(r.Context(), input)
	if err != nil {
		JSONError(w, r, http.StatusBadRequest, "CREATE_PROJECT_FAILED", err.Error(), nil)
		return
	}
	JSONResponse(w, r, http.StatusCreated, proj)
}

func (h *Handler) HandleListProjects(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("wsId")
	projects, err := h.workspaceUseCase.ListProjects(r.Context(), wsID)
	if err != nil {
		JSONError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	JSONResponse(w, r, http.StatusOK, projects)
}

// Collection & Request Handlers
func (h *Handler) HandleCreateCollection(w http.ResponseWriter, r *http.Request) {
	projID := r.PathValue("projId")
	var input in.CreateCollectionInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		JSONError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid payload", err.Error())
		return
	}
	input.ProjectID = projID

	col, err := h.collectionUseCase.CreateCollection(r.Context(), input)
	if err != nil {
		JSONError(w, r, http.StatusBadRequest, "CREATE_COLLECTION_FAILED", err.Error(), nil)
		return
	}
	JSONResponse(w, r, http.StatusCreated, col)
}

func (h *Handler) HandleListCollections(w http.ResponseWriter, r *http.Request) {
	projID := r.PathValue("projId")
	cols, err := h.collectionUseCase.ListCollections(r.Context(), projID)
	if err != nil {
		JSONError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	JSONResponse(w, r, http.StatusOK, cols)
}

func (h *Handler) HandleCreateRequest(w http.ResponseWriter, r *http.Request) {
	colID := r.PathValue("colId")
	var input in.CreateRequestInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		JSONError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid payload", err.Error())
		return
	}
	input.CollectionID = colID

	req, err := h.collectionUseCase.CreateRequest(r.Context(), input)
	if err != nil {
		JSONError(w, r, http.StatusBadRequest, "CREATE_REQUEST_FAILED", err.Error(), nil)
		return
	}
	JSONResponse(w, r, http.StatusCreated, req)
}

// Functional & Performance Test Handlers
func (h *Handler) HandleCreateTestSuite(w http.ResponseWriter, r *http.Request) {
	projID := r.PathValue("projId")
	var suite functional.TestSuite
	if err := json.NewDecoder(r.Body).Decode(&suite); err != nil {
		JSONError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid payload", err.Error())
		return
	}
	suite.ProjectID = projID

	created, err := h.executionUseCase.CreateTestSuite(r.Context(), &suite)
	if err != nil {
		JSONError(w, r, http.StatusBadRequest, "CREATE_SUITE_FAILED", err.Error(), nil)
		return
	}
	JSONResponse(w, r, http.StatusCreated, created)
}

func (h *Handler) HandleCreatePerformanceTest(w http.ResponseWriter, r *http.Request) {
	projID := r.PathValue("projId")
	var test performance.PerformanceTest
	if err := json.NewDecoder(r.Body).Decode(&test); err != nil {
		JSONError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid payload", err.Error())
		return
	}
	test.ProjectID = projID

	created, err := h.executionUseCase.CreatePerformanceTest(r.Context(), &test)
	if err != nil {
		JSONError(w, r, http.StatusBadRequest, "CREATE_PERF_TEST_FAILED", err.Error(), nil)
		return
	}
	JSONResponse(w, r, http.StatusCreated, created)
}

// Execution Handlers
func (h *Handler) HandleTriggerExecution(w http.ResponseWriter, r *http.Request) {
	claims := GetUserClaims(r.Context())
	var input in.TriggerExecutionInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		JSONError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid payload", err.Error())
		return
	}
	if claims != nil {
		input.TriggeredBy = claims.UserID
	}

	exec, err := h.executionUseCase.TriggerExecution(r.Context(), input)
	if err != nil {
		JSONError(w, r, http.StatusBadRequest, "TRIGGER_FAILED", err.Error(), nil)
		return
	}
	JSONResponse(w, r, http.StatusAccepted, exec)
}

func (h *Handler) HandleGetExecution(w http.ResponseWriter, r *http.Request) {
	execID := r.PathValue("id")
	exec, err := h.executionUseCase.GetExecution(r.Context(), execID)
	if err != nil {
		JSONError(w, r, http.StatusNotFound, "NOT_FOUND", "Execution not found", nil)
		return
	}
	JSONResponse(w, r, http.StatusOK, exec)
}

func (h *Handler) HandleStopExecution(w http.ResponseWriter, r *http.Request) {
	execID := r.PathValue("id")
	claims := GetUserClaims(r.Context())
	userID := "anonymous"
	if claims != nil {
		userID = claims.UserID
	}

	if err := h.executionUseCase.StopExecution(r.Context(), execID, userID); err != nil {
		JSONError(w, r, http.StatusBadRequest, "STOP_FAILED", err.Error(), nil)
		return
	}
	JSONResponse(w, r, http.StatusOK, map[string]string{"message": "Execution stopped successfully"})
}

// Health Check
func (h *Handler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	JSONResponse(w, r, http.StatusOK, map[string]string{
		"status":  "healthy",
		"service": "alpinex-api",
		"version": "1.0.0",
	})
}
