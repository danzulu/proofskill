import { AuthMessageForm } from "@/components/auth-message-form";

export const dynamic = "force-dynamic";

export default function UpdatePasswordPage() {
  return <div className="flex justify-center"><AuthMessageForm mode="update" /></div>;
}

