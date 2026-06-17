"use client";

import {
  useRouter
} from "next/navigation";

import {
  useAuth
} from "@/context/AuthContext";

export default function Navbar() {

  const router =
    useRouter();

  const { user } =
    useAuth();

  function logout() {

    localStorage.removeItem(
      "token"
    );

    router.push(
      "/auth/login"
    );
  }

  return (

    <div
      className="
      flex
      justify-between
      items-center
      border-b
      p-4
      "
    >

      <div>

        {user?.email}

      </div>

      <button
        onClick={logout}
      >
        Logout
      </button>

    </div>
  );
}