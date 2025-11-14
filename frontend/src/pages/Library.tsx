import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { textbookAPI } from "../services/api";
import type { Textbook } from "../types";

export default function Library() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
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
      // Reset form
      setUploadFile(null);
      setUploadTitle("");
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
      // Reload textbooks
      await loadTextbooks();
    } catch (err: any) {
      setError("Failed to delete textbook");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Textbooks</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/query")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Ask Question
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Textbook</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Textbook Title
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g., Biology 101"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                required
                className="w-full"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading || !uploadFile}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {isUploading ? "Uploading..." : "Upload Textbook"}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Textbooks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {textbooks.map((textbook) => (
            <div key={textbook.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {textbook.title}
              </h3>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  {textbook.processed ? (
                    <span className="text-green-600 font-semibold">
                      ✓ Ready
                    </span>
                  ) : (
                    <span className="text-yellow-600 font-semibold">
                      ⏳ Processing
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-medium">Uploaded:</span>{" "}
                  {new Date(textbook.uploaded_at).toLocaleDateString()}
                </div>
              </div>

              <button
                onClick={() => handleDelete(textbook.id, textbook.title)}
                className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {textbooks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No textbooks yet. Upload one to get started!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
