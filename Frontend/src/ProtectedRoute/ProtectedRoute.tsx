import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("authorization");

  if (!token) {
    toast.error("Please sign up to enter the workspace");
    return <Navigate to={"/"}></Navigate>;
  } else {
    return children;
  }
};

export default ProtectedRoute;
