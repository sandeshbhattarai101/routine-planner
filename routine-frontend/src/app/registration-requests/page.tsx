"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getRequests,
  approveRequest,
  rejectRequest,
} from "@/services/registration_service";

import {
  RegistrationRequest,
} from "@/types/registration";

export default function Page() {

  const [
    requests,
    setRequests,
  ] = useState<
    RegistrationRequest[]
  >([]);

  async function load() {

    const data =
      await getRequests();

    setRequests(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(
    id: string
  ) {

    await approveRequest(id);

    await load();
  }

  async function reject(
    id: string
  ) {

    await rejectRequest(id);

    await load();
  }

  return (
    <div>

      <h1 className="text-3xl mb-6">
        Registration Requests
      </h1>

      <table className="w-full border">

        <thead>

          <tr>

            <th>School</th>

            <th>Admin</th>

            <th>Email</th>

            <th>Status</th>

            <th>Actions</th>

          </tr>

        </thead>

        <tbody>

          {requests.map(
            (r) => (
              <tr key={r.id}>

                <td>
                  {r.school_name}
                </td>

                <td>
                  {r.admin_name}
                </td>

                <td>
                  {r.email}
                </td>

                <td>
                  {r.status}
                </td>

                <td>

                  {r.status ===
                    "PENDING" && (
                    <>
                      <button
                        onClick={() =>
                          approve(
                            r.id
                          )
                        }
                      >
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          reject(
                            r.id
                          )
                        }
                      >
                        Reject
                      </button>
                    </>
                  )}

                </td>

              </tr>
            )
          )}

        </tbody>

      </table>

    </div>
  );
}