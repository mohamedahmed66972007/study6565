import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { adminUsername, adminPassword } from "@shared/schema";

interface AuthContextType {
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check if user is admin on initial load
  useEffect(() => {
    const storedAdmin = localStorage.getItem("isAdmin");
    if (storedAdmin === "true") {
      setIsAdmin(true);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Call the API to validate admin credentials
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      
      if (response.ok) {
        setIsAdmin(true);
        localStorage.setItem("isAdmin", "true");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem("isAdmin");
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
