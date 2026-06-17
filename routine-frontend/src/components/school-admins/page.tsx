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
} from "@/services/school.service";

import {
  getSchoolAdmins,
  createSchoolAdmin,
  activateAdmin,
  deactivateAdmin,
} from "@/services/schoolAdmin.service";

import SchoolAdminForm
from "@/components/school-admins/SchoolAdminForm";

import SchoolAdminTable
from "@/components/school-admins/SchoolAdminTable";

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

    <div>

      <h1
        className="
        text-3xl
        font-bold
        mb-6
        "
      >
        School Admins
      </h1>

      <SchoolAdminForm
        schools={schools}
        onSubmit={
          createAdmin
        }
      />

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

    </div>
  );
}