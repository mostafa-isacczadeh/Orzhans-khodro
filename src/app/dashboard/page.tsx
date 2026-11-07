import { redirect } from "next/navigation";
import { homeFor, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireUser();
  redirect(homeFor(user.role, user.phone));
}
