"use client";

import { SchoolAdmin } from "@/types/schoolAdmin";
import { School } from "@/types/school";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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

  if (admins.length === 0) {
    return <p className="text-sm text-muted-foreground">No school admins yet.</p>;
  }

  return (

    <Table>

      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>School</TableHead>
          <TableHead>Status</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>

        {admins.map(
          (admin) => (

            <TableRow key={admin.id}>

              <TableCell className="font-medium">
                {admin.email}
              </TableCell>

              <TableCell>
                {getSchoolName(
                  admin.school_id
                )}
              </TableCell>

              <TableCell>
                <span
                  className={
                    admin.is_active
                      ? "text-emerald-600"
                      : "text-muted-foreground"
                  }
                >
                  {admin.is_active
                    ? "Active"
                    : "Inactive"}
                </span>
              </TableCell>

              <TableCell>

                {admin.is_active ? (

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      onDeactivate(
                        admin.id
                      )
                    }
                  >
                    Deactivate
                  </Button>

                ) : (

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onActivate(
                        admin.id
                      )
                    }
                  >
                    Activate
                  </Button>

                )}

              </TableCell>

            </TableRow>

          )
        )}

      </TableBody>

    </Table>
  );
}
