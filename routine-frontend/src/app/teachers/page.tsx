"use client";

import { useEffect, useState } from "react";
import { getTeachers, Lookup } from "@/services/timetable_service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function Page() {
  const [teachers, setTeachers] = useState<
    (Lookup & { max_periods_per_day: number })[]
  >([]);

  useEffect(() => {
    getTeachers().then(setTeachers);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Teachers</h1>
        <p className="text-sm text-muted-foreground">
          Teachers are added via Excel/CSV import on the Upload Excel page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All teachers</CardTitle>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teachers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Max periods/day</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.max_periods_per_day}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
