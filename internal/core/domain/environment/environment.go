package environment

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"
)

var (
	ErrEmptyEnvironmentName = errors.New("environment name cannot be empty")
	ErrInvalidVariableKey   = errors.New("variable key must match alphanumeric or underscore pattern")
)

var validKeyPattern = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)
var varInterpolationPattern = regexp.MustCompile(`\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}`)

// Variable represents a key-value pair within an environment.
type Variable struct {
	Key       string
	Value     string // Encrypted ciphertext if IsSecret is true
	IsSecret  bool
	UpdatedAt time.Time
}

// Environment models a target configuration (e.g., Development, Staging, Production).
type Environment struct {
	ID          string
	ProjectID   string
	Name        string
	Description string
	Variables   map[string]Variable
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func NewEnvironment(id, projectID, name, description string) (*Environment, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, ErrEmptyEnvironmentName
	}

	now := time.Now().UTC()
	return &Environment{
		ID:          id,
		ProjectID:   projectID,
		Name:        name,
		Description: description,
		Variables:   make(map[string]Variable),
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

func (e *Environment) SetVariable(key, value string, isSecret bool) error {
	key = strings.TrimSpace(key)
	if !validKeyPattern.MatchString(key) {
		return fmt.Errorf("%w: %s", ErrInvalidVariableKey, key)
	}

	if e.Variables == nil {
		e.Variables = make(map[string]Variable)
	}

	e.Variables[key] = Variable{
		Key:       key,
		Value:     value,
		IsSecret:  isSecret,
		UpdatedAt: time.Now().UTC(),
	}
	e.UpdatedAt = time.Now().UTC()
	return nil
}

// VariableResolver handles hierarchical variable precedence and text interpolation.
// Precedence: Runtime/Request Overrides > Environment Variables > Global Defaults.
type VariableResolver struct {
	scopes []map[string]string // Ordered from lowest to highest precedence
}

func NewVariableResolver() *VariableResolver {
	return &VariableResolver{
		scopes: make([]map[string]string, 0),
	}
}

// PushScope adds a scope map. Scopes pushed later override earlier scopes.
func (r *VariableResolver) PushScope(scope map[string]string) {
	if scope != nil {
		r.scopes = append(r.scopes, scope)
	}
}

// Resolve looks up a key across all pushed scopes following precedence.
func (r *VariableResolver) Resolve(key string) (string, bool) {
	for i := len(r.scopes) - 1; i >= 0; i-- {
		if val, exists := r.scopes[i][key]; exists {
			return val, true
		}
	}
	return "", false
}

// Interpolate replaces {{key}} placeholders in template text with resolved variable values.
func (r *VariableResolver) Interpolate(template string) string {
	return varInterpolationPattern.ReplaceAllStringFunc(template, func(match string) string {
		sub := varInterpolationPattern.FindStringSubmatch(match)
		if len(sub) > 1 {
			key := sub[1]
			if val, ok := r.Resolve(key); ok {
				return val
			}
		}
		return match // Keep original if undefined
	})
}
