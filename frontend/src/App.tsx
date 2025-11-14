import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Library from "./pages/Library";
import Query from "./pages/Query";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route - redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login page */}
        <Route path="/login" element={<Login />} />

        {/* Library page (protected) */}
        <Route path="/library" element={<Library />} />

        {/* Query page (protected) */}
        <Route path="/query" element={<Query />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
