package http

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
)

type APIResponse struct {
	Success  bool        `json:"success"`
	Data     interface{} `json:"data,omitempty"`
	Error    *APIError   `json:"error,omitempty"`
	Metadata Metadata    `json:"metadata"`
}

type APIError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

type Metadata struct {
	CorrelationID string    `json:"correlation_id"`
	Timestamp     time.Time `json:"timestamp"`
}

func JSONResponse(w http.ResponseWriter, r *http.Request, statusCode int, data interface{}) {
	corrID := r.Header.Get("X-Correlation-ID")
	if corrID == "" {
		corrID = uuid.NewString()
	}

	resp := APIResponse{
		Success: statusCode >= 200 && statusCode < 300,
		Data:    data,
		Metadata: Metadata{
			CorrelationID: corrID,
			Timestamp:     time.Now().UTC(),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(resp)
}

func JSONError(w http.ResponseWriter, r *http.Request, statusCode int, code, message string, details interface{}) {
	corrID := r.Header.Get("X-Correlation-ID")
	if corrID == "" {
		corrID = uuid.NewString()
	}

	resp := APIResponse{
		Success: false,
		Error: &APIError{
			Code:    code,
			Message: message,
			Details: details,
		},
		Metadata: Metadata{
			CorrelationID: corrID,
			Timestamp:     time.Now().UTC(),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(resp)
}
