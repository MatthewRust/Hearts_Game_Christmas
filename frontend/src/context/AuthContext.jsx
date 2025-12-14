import {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import api, {
  loginRequest,
  registerRequest,
  setAccessToken,
  clearAccessToken,
} from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [user, setUser] = useState(null);

  const refreshInFlightRef = useRef(null);

  const loadMe = useCallback(async () => {
    const res = await api.get("/auth/me");
    const u = res.data;
    setUser(u);
    setRoles(u.roles || []);
    setIsAuth(true);
  }, []);

  const refresh = useCallback(async () => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    setLoading(true);

    const p = (async () => {
      try {
        const res = await api.post("/auth/refresh");
        const token = res.data?.access_token;
        if (token) {
          setAccessToken(token);
          await loadMe();
          return "authenticated";
        }
        clearAccessToken();
        setIsAuth(false);
        setRoles([]);
        setUser(null);
        return "unauthenticated";
      } catch (error) {
        if (error?.isOffline) {
          return "offline";
        }
        clearAccessToken();
        setIsAuth(false);
        setRoles([]);
        setUser(null);
        return "unauthenticated";
      } finally {
        setLoading(false);
      }
    })();

    refreshInFlightRef.current = p;
    p.finally(() => {
      if (refreshInFlightRef.current === p) refreshInFlightRef.current = null;
    });
    return p;
  }, [loadMe]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onOnline = () => refresh();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [refresh]);

  const login = async (username, password) => {
    try {
      const response = await loginRequest(username, password);
      const token = response?.data?.access_token;
      if (token) {
        setAccessToken(token);
        await loadMe();
      }
      return response;
    } catch (error) {
      if (!error?.response || error?.isOffline) {
        return { message: "Network error. Please check your connection." };
      }
      console.error("Login error:", error);
      return { message: "Unable to log in. Please try again." };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await registerRequest(username, email, password);
      return response;
    } catch (error) {
      if (!error?.response || error?.isOffline) {
        return { message: "Network error. Please check your connection." };
      }
      console.error("Registration error:", error);
      return { message: "Unable to register. Please try again." };
    }
  };

  const logout = () => {
    setIsAuth(false);
    clearAccessToken();
    setRoles([]);
    setUser(null);
    api.post("/auth/logout").catch((e) => console.error("Logout error:", e));
  };

  const hasRole = (roleName) => roles.some((r) => r.name === roleName);
  const hasAnyRole = (list) =>
    list.some((role) => roles.some((r) => r.name === role));

  const status = loading
    ? "loading"
    : isAuth
    ? "authenticated"
    : "unauthenticated";
  const isRefreshing = !!refreshInFlightRef.current;

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        user,
        roles,
        loading,
        status,
        isRefreshing,
        login,
        register,
        logout,
        hasRole,
        hasAnyRole,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
