"use client";

import { useEffect, useState } from "react";
import { getSubjects, Lookup } from "@/services/timetable_service";
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
  const [subjects, setSubjects] = useState<Lookup[]>([]);

  useEffect(() => {
    getSubjects().then(setSubjects);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Subjects</h1>
        <p className="text-sm text-muted-foreground">
          Subjects are added via Excel/CSV import on the Upload Excel page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
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
