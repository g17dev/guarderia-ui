import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import ChildAccess from "./pages/ChildAccess";
import ChildHandover from "./pages/ChildHandover";
import { Dashboard } from "./pages/Dashboard";
import {ChildrenManagement} from "./pages/ChildrenManagement"
import { ChildNew } from "./pages/ChildNew";
import { ToastProvider } from "./context/ToastContext";
import { ToastContainer } from "./components/toasts/ToastContainer";

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard/>} />
            <Route path="children" element={<ChildrenManagement />} />
            <Route path="children/new" element={<ChildNew />} />
            <Route path="/access" element={<ChildAccess />} />
            <Route path="/handover" element={<ChildHandover/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </ToastProvider>
  );
}