"use client";

import { SchoolAdmin } from "@/types/schoolAdmin";
import { School } from "@/types/school";

interface Props {

  admins: SchoolAdmin[];

  schools: School[];

  onActivate: (
    id: string
  ) => Promise<void>;

  onDeactivate: (
    id: string
  ) => Promise<void>;
}

export default function SchoolAdminTable({
  admins,
  schools,
  onActivate,
  onDeactivate,
}: Props) {

  function getSchoolName(
    schoolId: string
  ) {

    return (
      schools.find(
        (s) =>
          s.id === schoolId
      )?.name
      ?? "Unknown"
    );
  }

  return (

    <table
      className="
      w-full
      border
      "
    >

      <thead>

        <tr>

          <th>Email</th>

          <th>School</th>

          <th>Status</th>

          <th>Actions</th>

        </tr>

      </thead>

      <tbody>

        {admins.map(
          (admin) => (

            <tr key={admin.id}>

              <td>
                {admin.email}
              </td>

              <td>
                {getSchoolName(
                  admin.school_id
                )}
              </td>

              <td>

                {admin.is_active
                  ? "Active"
                  : "Inactive"}

              </td>

              <td>

                {admin.is_active ? (

                  <button
                    onClick={() =>
                      onDeactivate(
                        admin.id
                      )
                    }
                  >
                    Deactivate
                  </button>

                ) : (

                  <button
                    onClick={() =>
                      onActivate(
                        admin.id
                      )
                    }
                  >
                    Activate
                  </button>

                )}

              </td>

            </tr>

          )
        )}

      </tbody>

    </table>
  );
}