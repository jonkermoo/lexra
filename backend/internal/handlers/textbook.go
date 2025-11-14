package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/jonkermoo/rag-textbook/backend/internal/database"
	"github.com/jonkermoo/rag-textbook/backend/internal/middleware"
	"github.com/jonkermoo/rag-textbook/backend/internal/models"
)

type TextbookHandler struct {
	db *database.DB
}

func NewTextbookHandler(db *database.DB) *TextbookHandler {
	return &TextbookHandler{db: db}
}

// List all textbooks for the authenticated user
func (h *TextbookHandler) HandleListTextbooks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context
	userID, ok := middleware.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get textbooks from database
	textbooks, err := h.db.ListTextbooks(userID)
	if err != nil {
		log.Printf("Error listing textbooks: %v", err)
		http.Error(w, "Failed to list textbooks", http.StatusInternalServerError)
		return
	}

	// Return empty array if no textbooks (not null)
	if textbooks == nil {
		textbooks = []models.Textbook{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(textbooks)
}

// Get a single textbook by ID
func (h *TextbookHandler) HandleGetTextbook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context
	userID, ok := middleware.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract textbook ID from URL path
	// Expecting: /api/textbooks/123
	textbookID, err := extractIDFromPath(r.URL.Path, "/api/textbooks/")
	if err != nil {
		http.Error(w, "Invalid textbook ID", http.StatusBadRequest)
		return
	}

	// Get textbook from database
	textbook, err := h.db.GetTextbook(textbookID)
	if err != nil {
		http.Error(w, "Textbook not found", http.StatusNotFound)
		return
	}

	// Check ownership
	if textbook.UserID != userID {
		http.Error(w, "Permission denied", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(textbook)
}

// Delete a textbook
func (h *TextbookHandler) HandleDeleteTextbook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context
	userID, ok := middleware.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract textbook ID from URL path
	textbookID, err := extractIDFromPath(r.URL.Path, "/api/textbooks/")
	if err != nil {
		http.Error(w, "Invalid textbook ID", http.StatusBadRequest)
		return
	}

	// Delete textbook (also deletes chunks via database method)
	err = h.db.DeleteTextbook(textbookID, userID)
	if err != nil {
		if strings.Contains(err.Error(), "permission denied") {
			http.Error(w, "Permission denied", http.StatusForbidden)
			return
		}
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, "Textbook not found", http.StatusNotFound)
			return
		}
		log.Printf("Error deleting textbook: %v", err)
		http.Error(w, "Failed to delete textbook", http.StatusInternalServerError)
		return
	}

	log.Printf("Textbook %d deleted by user %d", textbookID, userID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Textbook deleted successfully",
	})
}

// Get textbook processing status
func (h *TextbookHandler) HandleGetTextbookStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context
	userID, ok := middleware.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract textbook ID from URL path
	// Expecting: /api/textbooks/123/status
	textbookID, err := extractIDFromPath(r.URL.Path, "/api/textbooks/")
	if err != nil {
		http.Error(w, "Invalid textbook ID", http.StatusBadRequest)
		return
	}

	// Get textbook from database
	textbook, err := h.db.GetTextbook(textbookID)
	if err != nil {
		http.Error(w, "Textbook not found", http.StatusNotFound)
		return
	}

	// Check ownership
	if textbook.UserID != userID {
		http.Error(w, "Permission denied", http.StatusForbidden)
		return
	}

	// Get chunk count
	chunkCount, err := h.db.GetTextbookChunkCount(textbookID)
	if err != nil {
		log.Printf("Error getting chunk count: %v", err)
		chunkCount = 0
	}

	status := map[string]interface{}{
		"textbook_id": textbook.ID,
		"title":       textbook.Title,
		"processed":   textbook.Processed,
		"chunk_count": chunkCount,
		"uploaded_at": textbook.UploadedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// Helper function to extract ID from URL path
func extractIDFromPath(path, prefix string) (int, error) {
	// Remove prefix and any trailing parts (like /status)
	idStr := strings.TrimPrefix(path, prefix)
	idStr = strings.Split(idStr, "/")[0]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, fmt.Errorf("invalid ID: %s", idStr)
	}

	return id, nil
}
