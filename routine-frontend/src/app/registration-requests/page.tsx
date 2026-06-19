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
import { Button } from "@/components/ui/button";

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

  function statusColor(status: string) {
    if (status === "APPROVED") return "text-emerald-600";
    if (status === "REJECTED") return "text-destructive";
    return "text-muted-foreground";
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-semibold">Registration Requests</h1>
        <p className="text-sm text-muted-foreground">
          Review schools that have self-registered and approve or reject them.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No registration requests yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {requests.map(
                  (r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.school_name}</TableCell>
                      <TableCell>{r.admin_name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell className={statusColor(r.status)}>{r.status}</TableCell>
                      <TableCell>
                        {r.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => approve(r.id)}>
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => reject(r.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
