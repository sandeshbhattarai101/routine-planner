"use client";

import {
  useAuth
} from "@/context/AuthContext";

export default function DashboardPage() {

  const { user } =
    useAuth();

  return (

    <div>

      <h1
        className="
        text-3xl
        font-bold
        mb-6
        "
      >
        Dashboard
      </h1>

      <div
        className="
        grid
        grid-cols-4
        gap-4
        "
      >

        <div
          className="
          border
          rounded
          p-4
          "
        >
          Role:
          {user?.role}
        </div>

        <div
          className="
          border
          rounded
          p-4
          "
        >
          Email:
          {user?.email}
        </div>

      </div>

    </div>
  );
}