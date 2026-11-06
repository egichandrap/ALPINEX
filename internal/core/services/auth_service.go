package services

import (
	"context"
	"errors"

	"github.com/alpinex/alpinex/internal/core/domain/iam"
	"github.com/alpinex/alpinex/internal/core/ports/in"
	"github.com/alpinex/alpinex/internal/core/ports/out"
	"github.com/google/uuid"
)

var (
	ErrEmailAlreadyExists = errors.New("user with this email already exists")
	ErrUserNotFound       = errors.New("user not found")
)

type AuthService struct {
	userRepo     out.UserRepository
	tokenService out.TokenService
}

func NewAuthService(userRepo out.UserRepository, tokenService out.TokenService) *AuthService {
	return &AuthService{
		userRepo:     userRepo,
		tokenService: tokenService,
	}
}

func (s *AuthService) Register(ctx context.Context, input in.RegisterUserInput) (*in.AuthResponse, error) {
	existing, err := s.userRepo.FindUserByEmail(ctx, input.Email)
	if err == nil && existing != nil {
		return nil, ErrEmailAlreadyExists
	}

	userID := uuid.NewString()
	user, err := iam.NewUser(userID, input.Email, input.Password, input.FullName, iam.RoleUser)
	if err != nil {
		return nil, err
	}

	if err := s.userRepo.SaveUser(ctx, user); err != nil {
		return nil, err
	}

	accessToken, err := s.tokenService.GenerateAccessToken(user)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.tokenService.GenerateRefreshToken(user)
	if err != nil {
		return nil, err
	}

	return &in.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, input in.LoginInput) (*in.AuthResponse, error) {
	user, err := s.userRepo.FindUserByEmail(ctx, input.Email)
	if err != nil || user == nil {
		return nil, iam.ErrInvalidCredentials
	}

	if err := user.VerifyPassword(input.Password); err != nil {
		return nil, err
	}

	accessToken, err := s.tokenService.GenerateAccessToken(user)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.tokenService.GenerateRefreshToken(user)
	if err != nil {
		return nil, err
	}

	return &in.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) GetProfile(ctx context.Context, userID string) (*iam.User, error) {
	user, err := s.userRepo.FindUserByID(ctx, userID)
	if err != nil || user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}
