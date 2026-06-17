"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { User } from "@/types/user";

import {
  getMe
} from "@/services/user_service";

interface AuthContextType {

  user: User | null;

  loading: boolean;

  refreshUser:
    () => Promise<void>;
}

const AuthContext =
  createContext<
    AuthContextType
  >(
    {} as AuthContextType
  );

export function AuthProvider({
  children,
}: {
  children:
    React.ReactNode;
}) {

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

  useEffect(() => {

    refreshUser();

  }, []);

  return (

    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
      }}
    >

      {children}

    </AuthContext.Provider>
  );
}

export const useAuth = () =>
  useContext(AuthContext);