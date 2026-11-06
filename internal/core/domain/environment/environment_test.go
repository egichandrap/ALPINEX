package environment_test

import (
	"testing"

	"github.com/alpinex/alpinex/internal/core/domain/environment"
)

func TestEnvironment_Variables(t *testing.T) {
	env, err := environment.NewEnvironment("env-1", "p-1", "Development", "Dev env")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Invalid variable key
	err = env.SetVariable("invalid-key-with-dashes", "value", false)
	if err == nil {
		t.Fatalf("expected error for invalid key with dashes")
	}

	// Valid variable key
	err = env.SetVariable("base_url", "https://api.dev.local", false)
	if err != nil {
		t.Fatalf("unexpected error setting valid variable: %v", err)
	}

	// Valid secret variable
	err = env.SetVariable("api_token", "secret_encrypted_val", true)
	if err != nil {
		t.Fatalf("unexpected error setting secret: %v", err)
	}

	if env.Variables["base_url"].Value != "https://api.dev.local" {
		t.Fatalf("unexpected variable value: %s", env.Variables["base_url"].Value)
	}
	if !env.Variables["api_token"].IsSecret {
		t.Fatalf("expected api_token to be marked as secret")
	}
}

func TestVariableResolver_PrecedenceAndInterpolation(t *testing.T) {
	resolver := environment.NewVariableResolver()

	// Global / Low Precedence Scope
	resolver.PushScope(map[string]string{
		"base_url": "https://default.example.com",
		"port":     "8080",
		"timeout":  "5000",
	})

	// Environment / Medium Precedence Scope
	resolver.PushScope(map[string]string{
		"base_url": "https://staging.example.com",
		"token":    "bearer_123",
	})

	// Runtime / Highest Precedence Scope
	resolver.PushScope(map[string]string{
		"token": "bearer_override_999",
	})

	// Check precedence
	url, _ := resolver.Resolve("base_url")
	if url != "https://staging.example.com" {
		t.Fatalf("expected staging.example.com, got %s", url)
	}

	port, _ := resolver.Resolve("port")
	if port != "8080" {
		t.Fatalf("expected 8080 from global scope, got %s", port)
	}

	tok, _ := resolver.Resolve("token")
	if tok != "bearer_override_999" {
		t.Fatalf("expected bearer_override_999 from runtime scope, got %s", tok)
	}

	// Test template interpolation
	rawURL := "{{base_url}}:{{port}}/v1/users?token={{token}}&unresolved={{missing_var}}"
	interpolated := resolver.Interpolate(rawURL)
	expected := "https://staging.example.com:8080/v1/users?token=bearer_override_999&unresolved={{missing_var}}"
	if interpolated != expected {
		t.Fatalf("expected %s, got %s", expected, interpolated)
	}
}
