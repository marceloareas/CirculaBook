import { createContext, useContext, useMemo, useState } from "react";

const AUTH_STORAGE_KEY = "circulabook-auth";
const MOCK_EMAIL = "marcelo@circulabook.com";
const MOCK_PASSWORD = "123456";

const AuthContext = createContext(null);

function readStoredSession() {
  const raw =
    window.localStorage.getItem(AUTH_STORAGE_KEY) ||
    window.sessionStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}


// Função temporaria ate ser adicionado o registro ou mais features para conta do usuario
function deriveNameFromEmail(email) {
  const localPart = email.split("@")[0] || "";

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredSession());

  const value = useMemo(() => {
    const login = (email, password, keepConnected) => {
      if (email !== MOCK_EMAIL || password !== MOCK_PASSWORD) {
        return false;
      }

      const session = {
        email,
        name: deriveNameFromEmail(email),
        role: "Usuário da Comunidade",
      };

      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);

      const storage = keepConnected
        ? window.localStorage
        : window.sessionStorage;
      storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      setUser(session);
      return true;
    };

    const logout = () => {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    };

    return {
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}