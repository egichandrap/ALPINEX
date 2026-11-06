package iam_test

import (
	"testing"

	"github.com/alpinex/alpinex/internal/core/domain/iam"
)

func TestNewUser_Validation(t *testing.T) {
	// Invalid identifier with forbidden spaces/symbols
	_, err := iam.NewUser("u-1", "invalid user with spaces", "admin", "John Doe", iam.RoleUser)
	if err != iam.ErrInvalidEmail {
		t.Fatalf("expected ErrInvalidEmail, got %v", err)
	}

	// Short password (< 4 characters)
	_, err = iam.NewUser("u-1", "admin", "abc", "John Doe", iam.RoleUser)
	if err != iam.ErrPasswordTooShort {
		t.Fatalf("expected ErrPasswordTooShort, got %v", err)
	}

	// Empty full name
	_, err = iam.NewUser("u-1", "admin", "admin", "", iam.RoleUser)
	if err != iam.ErrEmptyFullName {
		t.Fatalf("expected ErrEmptyFullName, got %v", err)
	}

	// Valid username "admin" with password "admin"
	adminUser, err := iam.NewUser("u-admin", "admin", "admin", "Platform Admin", iam.RoleSuperAdmin)
	if err != nil {
		t.Fatalf("unexpected error creating admin/admin: %v", err)
	}
	if adminUser.Email != "admin" {
		t.Fatalf("expected username 'admin', got %s", adminUser.Email)
	}

	// Valid email user
	user, err := iam.NewUser("u-1", "John.Doe@Example.com", "secret1234", "John Doe", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if user.Email != "john.doe@example.com" {
		t.Fatalf("expected email to be lowercased, got %s", user.Email)
	}
	if user.SystemRole != iam.RoleUser {
		t.Fatalf("expected default role USER, got %s", user.SystemRole)
	}
	if user.Status != iam.StatusActive {
		t.Fatalf("expected status ACTIVE, got %s", user.Status)
	}
}

func TestUser_PasswordVerificationAndChange(t *testing.T) {
	user, err := iam.NewUser("u-1", "john@example.com", "mysecurepass", "John Doe", iam.RoleUser)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Correct password
	if err := user.VerifyPassword("mysecurepass"); err != nil {
		t.Fatalf("expected password verification to pass, got: %v", err)
	}

	// Incorrect password
	if err := user.VerifyPassword("wrongpass"); err != iam.ErrInvalidCredentials {
		t.Fatalf("expected ErrInvalidCredentials, got: %v", err)
	}

	// Change password with wrong old password
	if err := user.ChangePassword("wrongpass", "brandnewsecret1"); err != iam.ErrInvalidCredentials {
		t.Fatalf("expected ErrInvalidCredentials, got: %v", err)
	}

	// Change password with short new password (< 4 chars)
	if err := user.ChangePassword("mysecurepass", "abc"); err != iam.ErrPasswordTooShort {
		t.Fatalf("expected ErrPasswordTooShort, got: %v", err)
	}

	// Valid change password
	if err := user.ChangePassword("mysecurepass", "brandnewsecret1"); err != nil {
		t.Fatalf("unexpected error on change password: %v", err)
	}

	// Verify old password fails
	if err := user.VerifyPassword("mysecurepass"); err == nil {
		t.Fatalf("expected old password to fail")
	}

	// Verify new password succeeds
	if err := user.VerifyPassword("brandnewsecret1"); err != nil {
		t.Fatalf("expected new password to succeed, got: %v", err)
	}
}
