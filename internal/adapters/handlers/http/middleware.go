package http

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/alpinex/alpinex/internal/core/ports/out"
)

type contextKey string

const (
	UserClaimsContextKey contextKey = "user_claims"
)

func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Correlation-ID")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("[%s] %s %s took %v", r.Method, r.URL.Path, r.RemoteAddr, time.Since(start))
	})
}

func AuthMiddleware(tokenService out.TokenService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				JSONError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Missing or invalid Authorization header", nil)
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := tokenService.ValidateToken(tokenString)
			if err != nil {
				JSONError(w, r, http.StatusUnauthorized, "INVALID_TOKEN", "Token is invalid or expired", nil)
				return
			}

			ctx := context.WithValue(r.Context(), UserClaimsContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserClaims(ctx context.Context) *out.TokenClaims {
	if val, ok := ctx.Value(UserClaimsContextKey).(*out.TokenClaims); ok {
		return val
	}
	return nil
}
