"use client";

import { useParams } from "next/navigation";
import MailboxPage from "../page";
// import Mailbox from ".";

export default function MailboxByIdPage() {
  const { id } = useParams();

  return (
    <MailboxPage />
  );
}
