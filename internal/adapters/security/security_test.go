package security_test

import (
	"context"
	"testing"
	"time"

	"github.com/alpinex/alpinex/internal/adapters/security"
	"github.com/alpinex/alpinex/internal/core/domain/iam"
)

func TestAESGCMCipher_EncryptDecrypt(t *testing.T) {
	key := []byte("01234567890123456789012345678901") // 32 bytes
	cipher, err := security.NewAESGCMCipher(key)
	if err != nil {
		t.Fatalf("unexpected error creating cipher: %v", err)
	}

	secret := "production_api_secret_token_12345"
	encrypted, err := cipher.Encrypt(secret)
	if err != nil {
		t.Fatalf("encryption failed: %v", err)
	}

	if encrypted == secret {
		t.Fatalf("encrypted value should not match plaintext")
	}

	decrypted, err := cipher.Decrypt(encrypted)
	if err != nil {
		t.Fatalf("decryption failed: %v", err)
	}

	if decrypted != secret {
		t.Fatalf("expected decrypted %s, got %s", secret, decrypted)
	}
}

func TestJWTService_GenerateAndValidate(t *testing.T) {
	jwtSvc := security.NewJWTService("my-super-secret-signing-key-minimum-32bytes", 15*time.Minute, 7*24*time.Hour)

	user, _ := iam.NewUser("u-99", "admin@alpinex.dev", "password123", "Admin User", iam.RoleSuperAdmin)

	accessTok, err := jwtSvc.GenerateAccessToken(user)
	if err != nil {
		t.Fatalf("failed to generate access token: %v", err)
	}

	claims, err := jwtSvc.ValidateToken(accessTok)
	if err != nil {
		t.Fatalf("token validation failed: %v", err)
	}

	if claims.UserID != "u-99" || claims.Email != "admin@alpinex.dev" || claims.SystemRole != iam.RoleSuperAdmin {
		t.Fatalf("claims mismatch: %+v", claims)
	}
}

func TestEgressValidator_SSRF(t *testing.T) {
	// Strict mode (allowPrivateIPs = false)
	strictValidator := security.NewEgressValidator(false)

	// Block localhost / 127.0.0.1
	err := strictValidator.ValidateTargetURL(context.Background(), "http://127.0.0.1:8080/metrics")
	if err != security.ErrSSRFBlocked {
		t.Fatalf("expected ErrSSRFBlocked, got %v", err)
	}

	// Block cloud metadata
	err = strictValidator.ValidateTargetURL(context.Background(), "http://169.254.169.254/latest/meta-data")
	if err != security.ErrSSRFBlocked {
		t.Fatalf("expected ErrSSRFBlocked for metadata IP, got %v", err)
	}

	// Dev mode allows private IPs
	devValidator := security.NewEgressValidator(true)
	err = devValidator.ValidateTargetURL(context.Background(), "http://127.0.0.1:8080/metrics")
	if err != nil {
		t.Fatalf("expected devValidator to allow 127.0.0.1, got %v", err)
	}
}
