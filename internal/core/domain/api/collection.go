package api

import (
	"errors"
	"strings"
	"time"
)

var (
	ErrEmptyCollectionName = errors.New("collection name cannot be empty")
	ErrEmptyRequestName    = errors.New("request name cannot be empty")
	ErrEmptyURLTemplate    = errors.New("URL template cannot be empty")
	ErrInvalidHTTPMethod   = errors.New("invalid or unsupported HTTP method")
)

type BodyType string

const (
	BodyTypeNone     BodyType = "NONE"
	BodyTypeJSON     BodyType = "JSON"
	BodyTypeXML      BodyType = "XML"
	BodyTypeForm     BodyType = "FORM"
	BodyTypeRaw      BodyType = "RAW"
	BodyTypeFormData BodyType = "MULTIPART_FORM"
)

type Header struct {
	Key     string
	Value   string
	Enabled bool
}

type QueryParam struct {
	Key     string
	Value   string
	Enabled bool
}

type AuthType string

const (
	AuthTypeNone   AuthType = "NONE"
	AuthTypeBasic  AuthType = "BASIC"
	AuthTypeBearer AuthType = "BEARER"
	AuthTypeAPIKey AuthType = "API_KEY"
)

type AuthConfig struct {
	Type     AuthType
	Username string
	Password string
	Token    string
	Key      string
	Value    string
	AddTo    string // "HEADER" or "QUERY"
}

// APIRequest represents an HTTP request specification.
type APIRequest struct {
	ID          string
	FolderID    *string
	Name        string
	Method      string // GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
	URLTemplate string // May contain {{variables}}
	Headers     []Header
	QueryParams []QueryParam
	BodyType    BodyType
	BodyContent string
	AuthConfig  AuthConfig
	TimeoutMs   int
	Position    int
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

var supportedMethods = map[string]bool{
	"GET": true, "POST": true, "PUT": true, "DELETE": true,
	"PATCH": true, "HEAD": true, "OPTIONS": true,
}

func NewAPIRequest(id, name, method, urlTemplate string) (*APIRequest, error) {
	name = strings.TrimSpace(name)
	method = strings.ToUpper(strings.TrimSpace(method))
	urlTemplate = strings.TrimSpace(urlTemplate)

	if name == "" {
		return nil, ErrEmptyRequestName
	}
	if !supportedMethods[method] {
		return nil, ErrInvalidHTTPMethod
	}
	if urlTemplate == "" {
		return nil, ErrEmptyURLTemplate
	}

	now := time.Now().UTC()
	return &APIRequest{
		ID:          id,
		Name:        name,
		Method:      method,
		URLTemplate: urlTemplate,
		Headers:     make([]Header, 0),
		QueryParams: make([]QueryParam, 0),
		BodyType:    BodyTypeNone,
		AuthConfig:  AuthConfig{Type: AuthTypeNone},
		TimeoutMs:   30000,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// Folder groups requests hierarchically.
type Folder struct {
	ID             string
	ParentFolderID *string
	Name           string
	Position       int
}

// Collection is an Aggregate Root grouping folders and API requests.
type Collection struct {
	ID          string
	ProjectID   string
	Name        string
	Description string
	Folders     map[string]*Folder
	Requests    map[string]*APIRequest
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func NewCollection(id, projectID, name, description string) (*Collection, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, ErrEmptyCollectionName
	}

	now := time.Now().UTC()
	return &Collection{
		ID:          id,
		ProjectID:   projectID,
		Name:        name,
		Description: description,
		Folders:     make(map[string]*Folder),
		Requests:    make(map[string]*APIRequest),
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

func (c *Collection) AddRequest(req *APIRequest) {
	if c.Requests == nil {
		c.Requests = make(map[string]*APIRequest)
	}
	c.Requests[req.ID] = req
	c.UpdatedAt = time.Now().UTC()
}

func (c *Collection) AddFolder(f *Folder) {
	if c.Folders == nil {
		c.Folders = make(map[string]*Folder)
	}
	c.Folders[f.ID] = f
	c.UpdatedAt = time.Now().UTC()
}
