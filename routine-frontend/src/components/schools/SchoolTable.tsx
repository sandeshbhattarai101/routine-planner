"use client";

import { School } from "@/types/school";

interface Props {
  schools: School[];

  onEdit: (school: School) => void;
}

export default function SchoolTable({
  schools,
  onEdit,
}: Props) {
  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th className="border p-2">
            Name
          </th>

          <th className="border p-2">
            Status
          </th>

          <th className="border p-2">
            Action
          </th>
        </tr>
      </thead>

      <tbody>
        {schools.map((school) => (
          <tr key={school.id}>
            <td className="border p-2">
              {school.name}
            </td>

            <td className="border p-2">
              {school.is_active
                ? "Active"
                : "Inactive"}
            </td>

            <td className="border p-2">
              <button
                onClick={() =>
                  onEdit(school)
                }
                className="
                rounded
                border
                px-3
                py-1
                "
              >
                Edit
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}