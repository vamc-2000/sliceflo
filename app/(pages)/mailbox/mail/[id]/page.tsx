"use client";

import { useParams } from "next/navigation";
import { useEmails } from "@/stores/mailbox-store";
import MailDisplay from "@/components/mailbox/mail-display";

export default function MailOnlyPage() {
  const { id } = useParams();
  const emails = useEmails();

  const mail = emails.find((e) => String(e.id) === id);

  if (!mail) return <div>Mail not found</div>;

  return (
    <div className="p-6">
      <MailDisplay mail={mail} />
    </div>
  );
}
