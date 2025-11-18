# Lexra
A cloud-deployed Retrieval-Augmented Generation (RAG) system that transforms textbooks and lecture notes into an interactive AI-powered knowledge base. Students can upload their course materials and ask natural language questions to receive accurate answers with precise page citations.

## Features
- Intelligent Document Processing: Upload PDFs up to 2GB, automatically chunked and embedded for semantic search
- AI-Powered Q&A: Ask questions in natural language and receive GPT-4-generated answers with page citations
- Vector Similarity Search: Fast semantic search using PostgreSQL with pgvector extension
- ChatGPT-Style Interface: Modern conversational UI with real-time processing status
- Secure Authentication: JWT-based authentication with bcrypt password hashing
= Cloud-Native Architecture: Deployed on AWS (EC2, RDS, S3) with Vercel frontend


## Tech Stack
### Backend
- Go (Golang) REST API
- Native net/http server
- JWT authentication with golang-jwt/jwt
- AWS SDK for S3 integration
- OpenAI Go client for embeddings and completions
- Deployed on AWS EC2

### Frontend
- React 19 + TypeScript
- React Router 7 for navigation
- Tailwind CSS 4 for styling
- Vite 7 for build tooling
- Axios for API communication
- Deployed on Vercel

### Processing Pipeline
- Python for PDF text extraction
- PyPDF2 for document parsing
- OpenAI text-embedding-3-small (1536 dimensions)
- Intelligent chunking: 500 words with 50-word overlap

### Database & Storage
- PostgreSQL 16 with pgvector extension
- Amazon RDS for managed database
- IVFFlat index for vector similarity search
- Amazon S3 for PDF storage

## Future updates:
- Probably will implement Resend API for extra verification + password reset
- Allow metadata to be stored in RDS as well (PDF of study guides or notes) and saved in the folders
- Support images in chat
- Better UI lol




