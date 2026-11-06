package services

import (
	"context"
	"errors"

	"github.com/alpinex/alpinex/internal/core/domain/api"
	"github.com/alpinex/alpinex/internal/core/ports/in"
	"github.com/alpinex/alpinex/internal/core/ports/out"
	"github.com/google/uuid"
)

var (
	ErrCollectionNotFound = errors.New("collection not found")
	ErrRequestNotFound    = errors.New("api request not found")
)

type CollectionService struct {
	repo out.CollectionRepository
}

func NewCollectionService(repo out.CollectionRepository) *CollectionService {
	return &CollectionService{repo: repo}
}

func (s *CollectionService) CreateCollection(ctx context.Context, input in.CreateCollectionInput) (*api.Collection, error) {
	colID := uuid.NewString()
	col, err := api.NewCollection(colID, input.ProjectID, input.Name, input.Description)
	if err != nil {
		return nil, err
	}

	if err := s.repo.SaveCollection(ctx, col); err != nil {
		return nil, err
	}
	return col, nil
}

func (s *CollectionService) GetCollection(ctx context.Context, colID string) (*api.Collection, error) {
	col, err := s.repo.FindCollectionByID(ctx, colID)
	if err != nil || col == nil {
		return nil, ErrCollectionNotFound
	}
	return col, nil
}

func (s *CollectionService) ListCollections(ctx context.Context, projectID string) ([]*api.Collection, error) {
	return s.repo.ListCollectionsByProject(ctx, projectID)
}

func (s *CollectionService) CreateRequest(ctx context.Context, input in.CreateRequestInput) (*api.APIRequest, error) {
	col, err := s.repo.FindCollectionByID(ctx, input.CollectionID)
	if err != nil || col == nil {
		return nil, ErrCollectionNotFound
	}

	reqID := uuid.NewString()
	req, err := api.NewAPIRequest(reqID, input.Name, input.Method, input.URLTemplate)
	if err != nil {
		return nil, err
	}

	req.FolderID = input.FolderID
	req.Headers = input.Headers
	req.QueryParams = input.QueryParams
	req.BodyType = input.BodyType
	req.BodyContent = input.BodyContent
	req.AuthConfig = input.AuthConfig
	if input.TimeoutMs > 0 {
		req.TimeoutMs = input.TimeoutMs
	}

	col.AddRequest(req)
	if err := s.repo.SaveRequest(ctx, input.CollectionID, req); err != nil {
		return nil, err
	}
	return req, nil
}

func (s *CollectionService) GetRequest(ctx context.Context, reqID string) (*api.APIRequest, error) {
	req, err := s.repo.FindRequestByID(ctx, reqID)
	if err != nil || req == nil {
		return nil, ErrRequestNotFound
	}
	return req, nil
}
