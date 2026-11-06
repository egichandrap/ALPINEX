package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	adapterHTTP "github.com/alpinex/alpinex/internal/adapters/handlers/http"
	"github.com/alpinex/alpinex/internal/adapters/persistence/memory"
	"github.com/alpinex/alpinex/internal/adapters/security"
	"github.com/alpinex/alpinex/internal/core/domain/api"
	"github.com/alpinex/alpinex/internal/core/domain/iam"
	"github.com/alpinex/alpinex/internal/core/domain/workspace"
	"github.com/alpinex/alpinex/internal/core/services"
)

func main() {
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	secretKey := os.Getenv("APP_SECRET")
	if secretKey == "" {
		secretKey = "default-insecure-secret-key-change-in-production-min-32-chars"
	}

	adminUser := os.Getenv("DEFAULT_ADMIN_USER")
	if adminUser == "" {
		adminUser = "admin"
	}
	adminPassword := os.Getenv("DEFAULT_ADMIN_PASSWORD")
	if adminPassword == "" {
		adminPassword = "admin"
	}

	log.Printf("🚀 Starting ALPINEX Control Plane API on port %s...", port)

	// In-memory repositories (default for single-container / local development)
	memRepo := memory.NewMemoryRepository()

	// Security adapters
	jwtSvc := security.NewJWTService(secretKey, 24*time.Hour, 7*24*time.Hour)

	// Core Services
	authSvc := services.NewAuthService(memRepo, jwtSvc)
	wsSvc := services.NewWorkspaceService(memRepo)
	colSvc := services.NewCollectionService(memRepo)
	execSvc := services.NewExecutionService(memRepo, memRepo, memRepo, nil, nil)

	// Seed Initial Default Admin User & Workspace for quick onboarding
	seedInitialData(context.Background(), memRepo, adminUser, adminPassword)

	// HTTP Handlers & Router
	handler := adapterHTTP.NewHandler(authSvc, wsSvc, colSvc, execSvc)
	router := adapterHTTP.NewRouter(handler, jwtSvc)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown channel
	shutdownChan := make(chan os.Signal, 1)
	signal.Notify(shutdownChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("✅ ALPINEX API Server listening at http://localhost:%s", port)
		log.Printf("👉 Default Admin Login: %s / %s", adminUser, adminPassword)
		log.Printf("ℹ️  (To customize default admin, set DEFAULT_ADMIN_USER and DEFAULT_ADMIN_PASSWORD in .env)")
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Server failed to listen: %v", err)
		}
	}()

	<-shutdownChan
	log.Println("Shutting down gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
	log.Println("Server stopped.")
}

func seedInitialData(ctx context.Context, repo *memory.MemoryRepository, adminUser, adminPassword string) {
	// Seed Admin User
	admin, err := iam.NewUser("user-admin-default", adminUser, adminPassword, "Platform Admin", iam.RoleSuperAdmin)
	if err == nil {
		_ = repo.SaveUser(ctx, admin)
	}

	// Seed Default Organization
	org, err := workspace.NewOrganization("org-default", "Default Organization", "default-org", "user-admin-default")
	if err == nil {
		_ = repo.SaveOrganization(ctx, org)
	}

	// Seed Default Workspace
	ws, err := workspace.NewWorkspace("ws-default", "org-default", "Default Workspace", "Primary testing workspace")
	if err == nil {
		_ = repo.SaveWorkspace(ctx, ws)
	}

	// Seed Demo Project
	proj, err := workspace.NewProject("proj-sample", "ws-default", "E-Commerce Demo", "Sample project for API & performance testing")
	if err == nil {
		_ = repo.SaveProject(ctx, proj)
	}

	// Seed Sample Collection
	col, err := api.NewCollection("col-sample", "proj-sample", "Storefront API", "Public endpoints")
	if err == nil {
		_ = repo.SaveCollection(ctx, col)

		// Seed Sample Request
		req, _ := api.NewAPIRequest("req-sample-1", "Get Status", "GET", "http://localhost:8080/health")
		_ = repo.SaveRequest(ctx, "col-sample", req)
	}

	fmt.Println("🌱 Initial default data seeded successfully.")
}
