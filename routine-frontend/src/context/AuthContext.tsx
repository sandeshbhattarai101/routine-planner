"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { User } from "@/types/user";

import {
  getMe
} from "@/services/user_service";

interface AuthContextType {

  user: User | null;

  loading: boolean;

  refreshUser:
    () => Promise<void>;

  logout:
    () => void;
}

const AuthContext =
  createContext<
    AuthContextType
  >(
    {} as AuthContextType
  );

export const PUBLIC_PATHS = [
  "/auth/login",
  "/register-school",
];

export function AuthProvider({
  children,
}: {
  children:
    React.ReactNode;
}) {

  const router = useRouter();

  const pathname = usePathname();

  const [user, setUser] =
    useState<User | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  async function refreshUser() {

    try {

      const data =
        await getMe();

      setUser(data);

    } catch {

      setUser(null);

    } finally {

      setLoading(false);
    }
  }

  function logout() {

    localStorage.removeItem(
      "token"
    );

    setUser(null);

    router.push(
      "/auth/login"
    );
  }

  useEffect(() => {

    refreshUser();

  }, []);

  useEffect(() => {

    if (loading) return;

    if (
      !user &&
      !PUBLIC_PATHS.includes(pathname)
    ) {

      router.replace(
        "/auth/login"
      );
    }

  }, [user, loading, pathname]);

  return (

    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        logout,
      }}
    >

      {children}

    </AuthContext.Provider>
  );
}

export const useAuth = () =>
  useContext(AuthContext);