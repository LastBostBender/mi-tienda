import { Navigate, Route, Routes } from "react-router-dom";
import AdminPage from "./pages/AdminPage";

export default function AdminApp() {
  return (
    <Routes>
      <Route path="/" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
