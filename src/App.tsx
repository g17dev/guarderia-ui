import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChildAccess from "./pages/ChildAccess";
import ChildHandover from "./pages/ChildHandover";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/access" element={<ChildAccess />} />
        <Route path="/handover" element={<ChildHandover/>}/>
      </Routes>
    </BrowserRouter>
  );
}