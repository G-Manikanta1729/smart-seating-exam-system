import React from "react";
import { Navigate } from "react-router-dom";
import { getUserRole, isAuthenticated } from "../../utils/auth";

interface Props {
  allowedRole: "ADMIN" | "STUDENT" | "FACULTY";
  children: React.ReactNode;
}

export const ProtectedRoute = ({ allowedRole, children }: Props) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" />;
  }

  const role = getUserRole();

  if (role !== allowedRole) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};
