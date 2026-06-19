"use client";

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
  schools: School[];

  onEdit: (school: School) => void;
}

export default function SchoolTable({
  schools,
  onEdit,
}: Props) {
  if (schools.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No schools yet.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {schools.map((school) => (
          <TableRow key={school.id}>
            <TableCell className="font-medium">{school.name}</TableCell>

            <TableCell>
              <span
                className={
                  school.is_active
                    ? "text-emerald-600"
                    : "text-muted-foreground"
                }
              >
                {school.is_active ? "Active" : "Inactive"}
              </span>
            </TableCell>

            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(school)}
              >
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
