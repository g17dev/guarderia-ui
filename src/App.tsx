import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import ChildAccess from "./pages/ChildAccess";
import ChildHandover from "./pages/ChildHandover";
import { Dashboard } from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard/>} />
          <Route path="/access" element={<ChildAccess />} />
          <Route path="/handover" element={<ChildHandover/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}