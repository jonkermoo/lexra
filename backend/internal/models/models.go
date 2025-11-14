package models

import "time"

// User represents a student
type User struct {
	ID                int        `json:"id"`
	Email             string     `json:"email"`
	PasswordHash      string     `json:"-"`
	Verified          bool       `json:"verified"`
	VerificationToken string     `json:"-"`
	CreatedAt         time.Time  `json:"created_at"`
	LastLogin         *time.Time `json:"last_login,omitempty"`
}

// Class represents a student's class/folder
type Class struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
}

// Textbook represents an uploaded textbook
type Textbook struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	Title      string    `json:"title"`
	S3Key      string    `json:"s3_key"`
	UploadedAt time.Time `json:"uploaded_at"`
	Processed  bool      `json:"processed"`
}

// Chunk: text chunk with embedding
type Chunk struct {
	ID         int       `json:"id"`
	TextbookID int       `json:"textbook_id"`
	Content    string    `json:"content"`
	PageNumber int       `json:"page_number"`
	ChunkIndex int       `json:"chunk_index"`
	Embedding  []float32 `json:"-"`
	CreatedAt  time.Time `json:"created_at"`
}

// QueryRequest
type QueryRequest struct {
	Question   string `json:"question"`
	TextbookID int    `json:"textbook_id"`
	TopK       int    `json:"top_k"`
}

// QueryResponse
type QueryResponse struct {
	Answer    string        `json:"answer"`
	Sources   []ChunkSource `json:"sources"`
	Question  string        `json:"question"`
	TimeTaken float64       `json:"time_taken_ms"`
}

// ChunkSource
type ChunkSource struct {
	PageNumber int     `json:"page_number"`
	Content    string  `json:"content"`
	Similarity float64 `json:"similarity"`
}

// Auth request/response models
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type VerifyEmailRequest struct {
	Token string `json:"token"`
}

// Upload request/response models
type UploadResponse struct {
	TextbookID int    `json:"textbook_id"`
	Title      string `json:"title"`
	Message    string `json:"message"`
}
