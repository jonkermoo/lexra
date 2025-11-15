import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { textbookAPI, queryAPI } from "../services/api";
import type { Textbook, QueryResponse } from "../types";

export default function Library() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Textbook | null>(null);
  const [question, setQuestion] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [answer, setAnswer] = useState<QueryResponse | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const navigate = useNavigate();

  // Load textbooks when page loads
  useEffect(() => {
    loadTextbooks();
  }, []);

  const loadTextbooks = async () => {
    try {
      const data = await textbookAPI.list();
      setTextbooks(data);
    } catch (err: any) {
      setError("Failed to load textbooks");
      if (err.response?.status === 401) {
        // Token expired, redirect to login
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setError("");

    try {
      await textbookAPI.upload(uploadFile, uploadTitle);
      // Reload textbooks
      await loadTextbooks();
      // Reset form and close modal
      setUploadFile(null);
      setUploadTitle("");
      setShowUploadModal(false);
    } catch (err: any) {
      setError(err.response?.data || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      await textbookAPI.delete(id);
      // Close folder if it's the one being deleted
      if (selectedFolder?.id === id) {
        setSelectedFolder(null);
        setAnswer(null);
      }
      // Reload textbooks
      await loadTextbooks();
    } catch (err: any) {
      setError("Failed to delete textbook");
    }
  };

  const handleOpenFolder = (textbook: Textbook) => {
    setSelectedFolder(textbook);
    setAnswer(null);
    setQuestion("");
  };

  const handleCloseFolder = () => {
    setSelectedFolder(null);
    setAnswer(null);
    setQuestion("");
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !selectedFolder) return;

    setIsQuerying(true);
    setError("");

    try {
      const response = await queryAPI.ask({
        question: question.trim(),
        textbook_id: selectedFolder.id,
      });
      setAnswer(response);
    } catch (err: any) {
      setError(err.response?.data || "Failed to get answer");
    } finally {
      setIsQuerying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  // Folder detail view
  if (selectedFolder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCloseFolder}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition border border-gray-700"
              >
                ← Back to Library
              </button>
              <div className="flex items-center gap-2">
                <div className="text-2xl">📁</div>
                <h1 className="text-2xl font-bold text-white">
                  {selectedFolder.title}
                </h1>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition border border-gray-700"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Status Badge */}
          {!selectedFolder.processed && (
            <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg mb-6">
              ⏳ This textbook is still being processed. Please check back in a
              few minutes.
            </div>
          )}

          {/* Question Form */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Ask a Question
            </h2>
            <form onSubmit={handleAskQuestion} className="space-y-4">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to know about this textbook?"
                disabled={!selectedFolder.processed}
                rows={4}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={
                  isQuerying || !question.trim() || !selectedFolder.processed
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-gray-600 transition shadow-lg shadow-blue-500/20"
              >
                {isQuerying ? "Searching..." : "Ask Question"}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Answer Display */}
          {answer && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Answer</h3>
              <p className="text-gray-300 mb-6 leading-relaxed whitespace-pre-wrap">
                {answer.answer}
              </p>

              {answer.sources && answer.sources.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-white mb-3">
                    Sources
                  </h4>
                  <div className="space-y-3">
                    {answer.sources.map((source, index) => (
                      <div
                        key={index}
                        className="bg-gray-900/50 border border-gray-700 rounded-lg p-4"
                      >
                        <div className="text-blue-400 font-medium mb-2">
                          Page {source.page_number}
                        </div>
                        <p className="text-gray-400 text-sm">
                          "{source.content}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Library view with folders
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-2xl">📚</div>
            <h1 className="text-3xl font-bold text-white">Lexra Library</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition border border-gray-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Folders Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {/* Add Folder Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="group relative bg-gray-800/30 backdrop-blur-sm border-2 border-dashed border-gray-600 rounded-lg shadow-lg p-6 hover:border-blue-500/50 transition cursor-pointer"
          >
            <div className="flex flex-col items-center">
              <div className="text-6xl mb-3 group-hover:scale-110 transition">
                ➕
              </div>
              <h3 className="text-sm font-semibold text-gray-400 text-center group-hover:text-blue-400 transition">
                Add Folder
              </h3>
            </div>
          </button>

          {/* Existing Folders */}
          {textbooks.map((textbook) => (
            <div
              key={textbook.id}
              className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg p-6 hover:border-blue-500/50 transition cursor-pointer"
              onClick={() => handleOpenFolder(textbook)}
            >
              {/* Folder Icon */}
              <div className="flex flex-col items-center">
                <div className="text-6xl mb-3 group-hover:scale-110 transition">
                  📁
                </div>
                <h3 className="text-sm font-semibold text-white text-center mb-2 line-clamp-2">
                  {textbook.title}
                </h3>

                {/* Status Badge */}
                <div className="text-xs mb-3">
                  {textbook.processed ? (
                    <span className="text-green-400 font-semibold">✓ Ready</span>
                  ) : (
                    <span className="text-yellow-400 font-semibold">
                      ⏳ Processing
                    </span>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(textbook.id, textbook.title);
                  }}
                  className="w-full px-3 py-1 bg-red-900/50 text-red-300 text-xs rounded hover:bg-red-800/50 transition border border-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {textbooks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-400 text-lg mb-2">
              No textbooks yet. Click the + button to add one!
            </p>
            <p className="text-gray-500 text-sm">
              Each textbook will appear as a folder you can click to ask
              questions.
            </p>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">
                Upload New Textbook
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadTitle("");
                  setError("");
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Textbook Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Biology 101"
                  required
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  PDF File
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  required
                  className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-semibold hover:file:bg-blue-500 file:cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadTitle("");
                    setError("");
                  }}
                  className="flex-1 px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-gray-600 transition shadow-lg shadow-blue-500/20"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
