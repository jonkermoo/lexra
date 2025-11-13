package database

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/jonkermoo/rag-textbook/backend/internal/models"
	_ "github.com/lib/pq"
)

type DB struct {
	conn *sql.DB
}

// Create a new database connection
func NewDB() (*DB, error) {
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_SSLMODE"),
	)

	conn, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := conn.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{conn: conn}, nil
}

// Finds the most similar chunks to a query embedding
func (db *DB) SearchSimilarChunks(textbookID int, queryEmbedding []float32, topK int) ([]models.Chunk, error) {
	// Convert embedding to pgvector format
	embeddingStr := fmt.Sprintf("[%v]", arrayToString(queryEmbedding))

	query := `
		SELECT id, textbook_id, content, page_number, chunk_index, created_at,
		       embedding <=> $1::vector AS distance
		FROM chunks
		WHERE textbook_id = $2
		ORDER BY embedding <=> $1::vector
		LIMIT $3
	`

	rows, err := db.conn.Query(query, embeddingStr, textbookID, topK)
	if err != nil {
		return nil, fmt.Errorf("failed to query similar chunks: %w", err)
	}
	defer rows.Close()

	var chunks []models.Chunk
	for rows.Next() {
		var chunk models.Chunk
		var distance float64

		err := rows.Scan(
			&chunk.ID,
			&chunk.TextbookID,
			&chunk.Content,
			&chunk.PageNumber,
			&chunk.ChunkIndex,
			&chunk.CreatedAt,
			&distance,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan chunk: %w", err)
		}

		chunks = append(chunks, chunk)
	}

	return chunks, nil
}

// Retrieve a textbook by ID
func (db *DB) GetTextbook(id int) (*models.Textbook, error) {
	var textbook models.Textbook

	query := `SELECT id, user_id, title, s3_key, uploaded_at, processed FROM textbooks WHERE id = $1`
	err := db.conn.QueryRow(query, id).Scan(
		&textbook.ID,
		&textbook.UserID,
		&textbook.Title,
		&textbook.S3Key,
		&textbook.UploadedAt,
		&textbook.Processed,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("textbook not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get textbook: %w", err)
	}

	return &textbook, nil
}

// Close the database connection
func (db *DB) Close() error {
	return db.conn.Close()
}

// Helper function to convert float slice to string for pgvector
func arrayToString(arr []float32) string {
	result := ""
	for i, v := range arr {
		if i > 0 {
			result += ","
		}
		result += fmt.Sprintf("%f", v)
	}
	return result
}
