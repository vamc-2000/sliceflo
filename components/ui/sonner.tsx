"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps, toast as sonnerToast } from "sonner"
import { CheckCircle, AlertTriangle, XCircle, Info, Check, CircleCheck,  } from "lucide-react"
import { UserPlus } from "phosphor-react"
import { FaUserPlus } from "react-icons/fa"

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastOptions {
  title: string
  description?: string
  primaryAction?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  duration?: number
}

// ─── Icon map ─────────────────────────────────────────────────────────────────
const iconMap: Record<ToastType, React.ReactNode> = {
  success: <Check className="h-4 w-4 text-white" strokeWidth={3.5} />,
  error: <span style={{ color: "white", fontWeight: 700, fontSize: "14px", lineHeight: 1 }}>!</span>,
  warning: <AlertTriangle className="h-4 w-4 text-white" strokeWidth={3.5} />,
  // info: <UserPlus style={{ color: "#0088FF", width: "18px", height: "18px" }} strokeWidth={2} />,
  info: <FaUserPlus size={18} color="#0088FF" />,
}

// ─── Color tokens per type ────────────────────────────────────────────────────
const styleMap: Record<ToastType, React.CSSProperties> = {
  success: { borderLeft: "4px solid #34C759", background: "#fff", color: "#111" },
  error: { borderLeft: "4px solid #FF383C", background: "#fff", color: "#111" },
  warning: { borderLeft: "4px solid #FF8D28", background: "#fff", color: "#111" },
  info: { borderLeft: "4px solid #0088FF", background: "#fff", color: "#111" },
}

// ─── Helper: render action buttons ────────────────────────────────────────────
function renderActions(
  options: ToastOptions,
  type: ToastType,
  toastId: string | number
) {
  const primaryColor: Record<ToastType, string> = {
    success: "#16a34a",
    error: "#FF383C",
    warning: "#FF8D28",
    info: "#0088FF",
  }

  const { primaryAction, secondaryAction } = options

  if (!primaryAction && !secondaryAction) return null

  return (
    <div style={{ display: "flex", gap: "25px", marginTop: "8px" }}>
      {secondaryAction && (
        <button
          onClick={() => {
            secondaryAction.onClick()
            sonnerToast.dismiss(toastId)
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "12px",
            letterSpacing: "0.05em",
            color: "#8E8E93",
            padding: 0,
            textTransform: "uppercase",
          }}
        >
          {secondaryAction.label}
        </button>
      )}
      {primaryAction && (
        <button
          onClick={() => {
            primaryAction.onClick()
            sonnerToast.dismiss(toastId)
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "12px",
            letterSpacing: "0.05em",
            color: primaryColor[type],
            padding: 0,
            textTransform: "uppercase",
          }}
        >
          {primaryAction.label}
        </button>
      )}
    </div>
  )
}

// ─── Main showToast function ───────────────────────────────────────────────────
export function toast(type: ToastType, options: ToastOptions) {
  const id = sonnerToast.custom(
    (toastId) => (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "14px 16px",
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          width: "360px",
          ...styleMap[type],
        }}
      >
        {/* Icon */}
        <div
          style={{
            flexShrink: 0,
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              type === "success" ? "rgba(52, 199, 89, 0.12)" :
                type === "error" ? "rgba(255, 56, 60, 0.1)" :
                  type === "warning" ? "rgba(255, 141, 40, 0.1)" :
                    "rgba(0, 136, 255, 0.1)",
          }}
        >
          {/* Inner solid circle for success only */}
          {type === "success" || type === "error" ? (
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",                      // ← solid green inner circle
                background: type === "success" ? "#34C759" : "#FF383C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {iconMap[type]}
            </div>
          ) : type === "warning" ? (
            // Orange triangle with white !
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L22 20H2L12 2Z" fill="#FF8D28" />
              <text
                x="12" y="17"
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="700"
                fontFamily="sans-serif"
              >!</text>
            </svg>
          ) : (
            iconMap[type]
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: "14px", margin: 0 }}>
            {options.title}
          </p>
          {options.description && (
            <p style={{ fontSize: "12px", color: "#4474F", margin: "2px 0 0" }}>
              {options.description}
            </p>
          )}
          {renderActions(options, type, toastId)}
        </div>
      </div>
    ),
    { duration: options.duration ?? 5000 }
  )
  return id
}

// ─── Toaster component ────────────────────────────────────────────────────────
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster, sonnerToast }