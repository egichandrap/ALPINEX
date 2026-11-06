package iam

import (
	"errors"
	"regexp"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidEmail        = errors.New("invalid email or username format")
	ErrPasswordTooShort    = errors.New("password must be at least 4 characters long")
	ErrEmptyFullName       = errors.New("full name cannot be empty")
	ErrInvalidCredentials  = errors.New("invalid email or password")
	ErrAccountInactive     = errors.New("user account is inactive")
	ErrUnauthorizedAction  = errors.New("user lacks permission for requested action")
)

// identifierRegex permits both standard usernames (e.g. "admin", "tester") and email addresses
var identifierRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+(@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})?$`)

type SystemRole string

const (
	RoleSuperAdmin SystemRole = "SUPER_ADMIN"
	RoleUser       SystemRole = "USER"
)

type AccountStatus string

const (
	StatusActive    AccountStatus = "ACTIVE"
	StatusInactive  AccountStatus = "INACTIVE"
	StatusSuspended AccountStatus = "SUSPENDED"
)

// User represents an authenticated identity within ALPINEX.
type User struct {
	ID           string        `json:"id"`
	Email        string        `json:"email"`
	PasswordHash string        `json:"-"` // Never serialized in responses
	FullName     string        `json:"full_name"`
	SystemRole   SystemRole    `json:"system_role"`
	Status       AccountStatus `json:"status"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

// NewUser creates and validates a new User entity, hashing the raw password.
func NewUser(id, email, rawPassword, fullName string, systemRole SystemRole) (*User, error) {
	id = strings.TrimSpace(id)
	email = strings.ToLower(strings.TrimSpace(email))
	fullName = strings.TrimSpace(fullName)

	if !identifierRegex.MatchString(email) {
		return nil, ErrInvalidEmail
	}
	if len(rawPassword) < 4 {
		return nil, ErrPasswordTooShort
	}
	if fullName == "" {
		return nil, ErrEmptyFullName
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(rawPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	if systemRole == "" {
		systemRole = RoleUser
	}

	now := time.Now().UTC()
	return &User{
		ID:           id,
		Email:        email,
		PasswordHash: string(hash),
		FullName:     fullName,
		SystemRole:   systemRole,
		Status:       StatusActive,
		CreatedAt:    now,
		UpdatedAt:    now,
	}, nil
}

// VerifyPassword checks if the provided raw password matches the stored hash.
func (u *User) VerifyPassword(rawPassword string) error {
	if u.Status != StatusActive {
		return ErrAccountInactive
	}
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(rawPassword))
	if err != nil {
		return ErrInvalidCredentials
	}
	return nil
}

// ChangePassword safely updates the user's password.
func (u *User) ChangePassword(oldPassword, newPassword string) error {
	if err := u.VerifyPassword(oldPassword); err != nil {
		return err
	}
	if len(newPassword) < 4 {
		return ErrPasswordTooShort
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	u.PasswordHash = string(newHash)
	u.UpdatedAt = time.Now().UTC()
	return nil
}

// IsSuperAdmin returns true if the user has global system administration privileges.
func (u *User) IsSuperAdmin() bool {
	return u.SystemRole == RoleSuperAdmin && u.Status == StatusActive
}
