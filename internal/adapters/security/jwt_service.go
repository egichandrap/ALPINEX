package security

import (
	"errors"
	"time"

	"github.com/alpinex/alpinex/internal/core/domain/iam"
	"github.com/alpinex/alpinex/internal/core/ports/out"
	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken = errors.New("invalid or expired token")
)

type JWTService struct {
	secretKey      []byte
	accessExpiry   time.Duration
	refreshExpiry  time.Duration
}

func NewJWTService(secretKey string, accessExpiry, refreshExpiry time.Duration) *JWTService {
	return &JWTService{
		secretKey:     []byte(secretKey),
		accessExpiry:  accessExpiry,
		refreshExpiry: refreshExpiry,
	}
}

type customClaims struct {
	UserID     string         `json:"uid"`
	Email      string         `json:"email"`
	SystemRole iam.SystemRole `json:"role"`
	jwt.RegisteredClaims
}

func (j *JWTService) GenerateAccessToken(user *iam.User) (string, error) {
	claims := customClaims{
		UserID:     user.ID,
		Email:      user.Email,
		SystemRole: user.SystemRole,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.accessExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.secretKey)
}

func (j *JWTService) GenerateRefreshToken(user *iam.User) (string, error) {
	claims := customClaims{
		UserID:     user.ID,
		Email:      user.Email,
		SystemRole: user.SystemRole,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.refreshExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.secretKey)
}

func (j *JWTService) ValidateToken(tokenString string) (*out.TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &customClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return j.secretKey, nil
	})

	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*customClaims)
	if !ok {
		return nil, ErrInvalidToken
	}

	return &out.TokenClaims{
		UserID:     claims.UserID,
		Email:      claims.Email,
		SystemRole: claims.SystemRole,
		ExpiresAt:  claims.ExpiresAt.Time,
	}, nil
}
