import { requireUser } from "@/lib/auth";
import NewRequestForm from "@/components/forms/NewRequestForm";
import { PageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewRequestPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageTitle
        title="درخواست ارزیابی رایگان"
        subtitle="درخواست شما در تابلوی مشترک تعمیرگاه‌های تأییدشده منتشر می‌شود و هر کدام جداگانه قیمت پیشنهادی خود را برایتان ارسال می‌کنند. شماره تماس شما به تعمیرگاه‌ها نمایش داده نمی‌شود."
      />
      <NewRequestForm />
    </div>
  );
}
