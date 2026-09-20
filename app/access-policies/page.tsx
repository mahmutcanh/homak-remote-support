import TechnicianSidebar from "@/components/TechnicianSidebar";
import TechnicianHeader from "@/components/TechnicianHeader";

export default function AccessPoliciesPage() {
  return (
    <>
      <TechnicianSidebar />
      <div className="lg:pl-64">
        <TechnicianHeader />
        <main className="relative pt-16 bg-surface w-full px-gutter-desktop min-h-screen">
          <div className="flex flex-col w-full items-center justify-center min-h-[calc(100vh-4rem)] gap-space-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[32px]">admin_panel_settings</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Access Policies</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
              RBAC yetki matrisi ve erişim politikası yönetimi bu bölümde yakında sunulacak. Bu sayfa henüz yer tutucu
              (placeholder) durumundadır.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
