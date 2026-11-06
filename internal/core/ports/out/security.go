package out

import (
	"context"
	"time"

	"github.com/alpinex/alpinex/internal/core/domain/iam"
)

// SecretCipher encrypts and decrypts sensitive values at rest using AES-GCM.
type SecretCipher interface {
	Encrypt(plaintext string) (string, error)
	Decrypt(ciphertext string) (string, error)
}

// TokenClaims represents the claims stored within a JWT token.
type TokenClaims struct {
	UserID     string
	Email      string
	SystemRole iam.SystemRole
	ExpiresAt  time.Time
}

// TokenService issues and validates cryptographically signed JWT tokens.
type TokenService interface {
	GenerateAccessToken(user *iam.User) (string, error)
	GenerateRefreshToken(user *iam.User) (string, error)
	ValidateToken(tokenString string) (*TokenClaims, error)
}

// EgressValidator ensures target URLs do not breach SSRF policies or ping forbidden IPs.
type EgressValidator interface {
	ValidateTargetURL(ctx context.Context, targetURL string) error
}
