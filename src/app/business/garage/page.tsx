import { getOwnGarage, requireRole } from "@/lib/auth";
import GarageForm from "@/components/forms/GarageForm";
import { Badge, Notice, PageTitle } from "@/components/ui";
import { GARAGE_STATUS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function GarageEditPage() {
  const user = await requireRole("business", "admin");
  const garage = await getOwnGarage(user.id);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageTitle
        title={garage ? "پروفایل تعمیرگاه" : "ثبت تعمیرگاه"}
        subtitle={garage ? "اطلاعات عمومی و محرمانه گاراژ خود را مدیریت کنید." : "اطلاعات گاراژ خود را وارد کنید تا پس از تأیید مدیریت فعال شود."}
        action={garage ? <Badge map={GARAGE_STATUS} value={garage.status} /> : undefined}
      />
      {!garage && user.role !== "admin" && (
        <div className="mb-6">
          <Notice>پس از ثبت، تعمیرگاه شما توسط مدیریت بررسی و تأیید می‌شود.</Notice>
        </div>
      )}
      <GarageForm
        garage={
          garage
            ? {
                name: garage.name,
                city: garage.city,
                district: garage.district,
                address: garage.address,
                phone: garage.phone,
                description: garage.description,
                workingHours: garage.workingHours,
                experienceYears: garage.experienceYears,
                services: garage.services,
              }
            : null
        }
      />
    </div>
  );
}
