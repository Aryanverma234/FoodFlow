
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem("foodflow_token") || "";
  });

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("foodflow_user")) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("foodflow_token", token);
    } else {
      localStorage.removeItem("foodflow_token");
      localStorage.removeItem("foodflow_user");
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("foodflow_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("foodflow_user");
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ token, setToken, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
