import { redirect } from "next/navigation";

export default function FeeDueRedirectPage() {
  redirect("/fees/dues");
}
