"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  School,
} from "@/types/school";

import {
  SchoolAdmin,
} from "@/types/schoolAdmin";

import {
  getSchools,
} from "@/services/school_service";

import {
  getSchoolAdmins,
  createSchoolAdmin,
  activateAdmin,
  deactivateAdmin,
} from "@/services/schoolAdmin_service";

import SchoolAdminForm
from "@/components/school-admins/SchoolAdminForm";

import SchoolAdminTable
from "@/components/school-admins/SchoolAdminTable";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {

  const [schools, setSchools] =
    useState<School[]>([]);

  const [admins, setAdmins] =
    useState<SchoolAdmin[]>([]);

  async function load() {

    const schoolData =
      await getSchools();

    const adminData =
      await getSchoolAdmins();

    setSchools(
      schoolData
    );

    setAdmins(
      adminData
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function createAdmin(
    email: string,
    password: string,
    schoolId: string
  ) {

    await createSchoolAdmin({
      email,
      password,
      school_id:
        schoolId,
    });

    await load();
  }

  async function activate(
    id: string
  ) {

    await activateAdmin(id);

    await load();
  }

  async function deactivate(
    id: string
  ) {

    await deactivateAdmin(id);

    await load();
  }

  return (

    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-semibold">School Admins</h1>
        <p className="text-sm text-muted-foreground">
          Manage school admin accounts, including ones created via self-registration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a school admin</CardTitle>
        </CardHeader>
        <CardContent>
          <SchoolAdminForm
            schools={schools}
            onSubmit={
              createAdmin
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All school admins</CardTitle>
        </CardHeader>
        <CardContent>
          <SchoolAdminTable
            admins={admins}
            schools={schools}
            onActivate={
              activate
            }
            onDeactivate={
              deactivate
            }
          />
        </CardContent>
      </Card>

    </div>
  );
}
