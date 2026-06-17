import AppSidebar from "@/components/layout/AppSidebar";

import Navbar from "@/components/layout/Navbar";


export default function Layout({
  children,
}: {
  children:
  React.ReactNode;
}) {

  return (

    <div
      className="
      flex
      min-h-screen
      "
    >

      <AppSidebar />

      <div
        className="
        flex-1
        "
      >

        <Navbar />

        <main
          className="p-6"
        >
          {children}
        </main>

      </div>

    </div>
  );
}