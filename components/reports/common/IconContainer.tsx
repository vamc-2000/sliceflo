// components/reports/common/IconContainer.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type BaseProps = {
  children: React.ReactNode;
  bgCircle?: boolean;
  className?: string;
  loading?: boolean;
};

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;
type DivProps = BaseProps &
  React.HTMLAttributes<HTMLDivElement>;
type AnchorProps = BaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement>;

type IconContainerProps = {
  asButton?: boolean;
  asAnchor?: boolean;
} & (ButtonProps | DivProps | AnchorProps);

const IconContainer = ({
  className,
  bgCircle = true,
  asButton = false,
  asAnchor = false,
  children,
  loading = false,
  ...rest
}: IconContainerProps) => {
  const commonProps = {
    className: cn(
      "flex items-center justify-center size-6 bg-muted cursor-pointer hover:scale-105 transition-transform",
      className,
      { "rounded-full": bgCircle }
    ),
  };

  const content = loading ? (
    <Skeleton className="h-3 w-3" />
  ) : (
    children
  );

  if (asAnchor) {
    return (
      <a
        {...commonProps}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  if (asButton) {
    return (
      <button
        {...commonProps}
        {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      {...commonProps}
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
    >
      {content}
    </div>
  );
};

export default IconContainer;
