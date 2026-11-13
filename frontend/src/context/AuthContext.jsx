
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return sessionStorage.getItem("foodflow_token") || "";
  });

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("foodflow_user")
      ) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      sessionStorage.setItem("foodflow_token", token);
    } else {
      sessionStorage.removeItem("foodflow_token");
      sessionStorage.removeItem("foodflow_user");
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(
        "foodflow_user",
        JSON.stringify(user)
      );
    } else {
      sessionStorage.removeItem("foodflow_user");
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ token, setToken, user, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
