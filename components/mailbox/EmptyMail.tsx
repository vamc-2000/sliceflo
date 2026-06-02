
import Image from "next/image";
export default function EmptyMail() {
  return (
    <div data-testid="empty-mail-container" className="flex justify-center bg-background px-1 pt-5">
      <div data-testid="empty-mail-card" className="flex flex-col rounded-2xl border border-border bg-muted shadow-md p-6 w-[370px]">
        {/* Header */}
        <div data-testid="empty-mail-header" className="flex items-center justify-between w-full">
          {/* Left: Logo + SliceFlo text */}
          <div data-testid="empty-mail-brand" className="flex items-center space-x-2">
            <Image
              data-testid="empty-mail-logo"
              src="/images/slicefloLogo.svg"
              alt="SliceFlo Logo"
              width={32}
              height={32}
              // className="w-8 h-8"
            />
            <span data-testid="empty-mail-brand-name" className="text-foreground text-base font-semibold">SliceFlo</span>
          </div>

          {/* Right: Date/Time + Mail Icon */}
          <div data-testid="empty-mail-date" className="flex items-center space-x-2 text-muted-foreground text-sm">
            <span>15 Dec, 10:30 AM</span>
          </div>
        </div>

        {/* Main Text */}
        <h2 data-testid="empty-mail-title" className="text-foreground font-semibold text-sm mt-3">
          Welcome to SliceFlo - We&apos;re glad you&apos;re here!
        </h2>
        <p data-testid="empty-mail-body" className="text-muted-foreground text-sm mt-1">
          <span className="block">Hi [First Name],</span>
          Thank you for signing up with SliceFlo - we&apos;re excited to have you o...
        </p>

        {/* Footer Icons */}
        <div data-testid="empty-mail-actions" className="flex justify-end space-x-4 mt-4">
          <button
            data-testid="empty-mail-snooze-btn"
            className="text-muted-foreground "
            title="Snooze"
          >
            
          </button>

          <button
            data-testid="empty-mail-delete-btn"
            className="text-muted-foreground "
            title="Delete"
          >
          </button>
        </div>
      </div>
    </div>
  );
}
