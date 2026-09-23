import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landingpage from "./Pages/Landingpage";
import Codeeditor from "./Pages/Codeeditor";
import Dashboard from "./Pages/Dashboard";
import Errorpage from "./Pages/Errorpage";
import ProtectedRoute from "./ProtectedRoute/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landingpage />}></Route>
        <Route
          path="/Codeeditor/:roomId"
          element={
            <ProtectedRoute>
              <Codeeditor />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path="/Dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        ></Route>
        <Route path="*" element={<Errorpage />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
