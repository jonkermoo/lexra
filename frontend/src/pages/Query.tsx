import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { textbookAPI, queryAPI } from "../services/api";
import type { Textbook, QueryResponse } from "../types";

export default function Query() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [selectedTextbookId, setSelectedTextbookId] = useState<number | null>(
    null
  );
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Load textbooks when page loads
  useEffect(() => {
    loadTextbooks();
  }, []);

  const loadTextbooks = async () => {
    try {
      const data = await textbookAPI.list();
      // Only show processed textbooks
      const processed = data.filter((t) => t.processed);
      setTextbooks(processed);

      // Auto-select first textbook if available
      if (processed.length > 0) {
        setSelectedTextbookId(processed[0].id);
      }
    } catch (err: any) {
      setError("Failed to load textbooks");
      if (err.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTextbookId || !question.trim()) return;

    setIsLoading(true);
    setError("");
    setAnswer(null);

    try {
      const response = await queryAPI.ask({
        textbook_id: selectedTextbookId,
        question: question.trim(),
      });
      setAnswer(response);
    } catch (err: any) {
      setError(err.response?.data || "Failed to get answer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Ask a Question</h1>
          <button
            onClick={() => navigate("/library")}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition border border-gray-700"
          >
            Back to Library
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Query Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Textbook Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Textbook
              </label>
              {textbooks.length === 0 ? (
                <div className="text-gray-400 text-sm p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                  No textbooks available. Please upload and process a textbook
                  first.
                </div>
              ) : (
                <select
                  value={selectedTextbookId || ""}
                  onChange={(e) =>
                    setSelectedTextbookId(Number(e.target.value))
                  }
                  required
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {textbooks.map((textbook) => (
                    <option key={textbook.id} value={textbook.id}>
                      {textbook.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Question Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to know?"
                required
                rows={4}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none placeholder-gray-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !selectedTextbookId || !question.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-gray-600 transition font-semibold shadow-lg shadow-blue-500/20"
            >
              {isLoading ? "Getting Answer..." : "Ask Question"}
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
            <h2 className="text-xl font-semibold text-white mb-4">Answer</h2>

            <div className="prose max-w-none mb-6">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {answer.answer}
              </p>
            </div>

            {/* Sources */}
            {answer.sources && answer.sources.length > 0 && (
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Sources (Page References)
                </h3>
                <div className="space-y-3">
                  {answer.sources.map((source, index) => (
                    <div
                      key={index}
                      className="bg-gray-900/50 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="font-medium text-blue-400 mb-2">
                        Page {source.page_number}
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-3">
                        {source.content}
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
