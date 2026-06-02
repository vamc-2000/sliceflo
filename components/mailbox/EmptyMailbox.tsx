import Image from "next/image";

export default function EmptyMailbox() {
  return (
    <div data-testid="empty-mailbox-container" className="flex items-center justify-center h-full p-0">
      {/* Empty State Illustration */}
      <Image
        data-testid="empty-mailbox-image"
        // src="/images/mailbox/empty-mail.svg"
        src="/images/mailbox/empty.png"  
        alt="No mails"
        width={300}
        height={300}
        priority
      />
    </div>
  );
}
