import { Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { createElement } from "react";

export type Status = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";

export type Role = "PATIENT" | "REVIEWER";

export const STATUS_COLORS = {
  PENDING: {
    icon: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  IN_REVIEW: {
    icon: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  APPROVED: {
    icon: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  REJECTED: {
    icon: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
} as const;

export function getStatusConfig(status: Status, iconSize: "sm" | "md" = "sm") {
  const sizeClass = iconSize === "sm" ? "h-3 w-3" : "h-4 w-4";
  
  const configs: Record<Status, { label: string; IconComponent: typeof Clock }> = {
    PENDING: { label: "Pending", IconComponent: Clock },
    IN_REVIEW: { label: "In Review", IconComponent: AlertCircle },
    APPROVED: { label: "Approved", IconComponent: CheckCircle2 },
    REJECTED: { label: "Rejected", IconComponent: XCircle },
  };
  
  const config = configs[status];
  return {
    label: config.label,
    icon: createElement(config.IconComponent, { className: sizeClass }),
    IconComponent: config.IconComponent,
  };
}

export const AUDIT_ACTIONS = {
  CREATED: "CREATED",
  VIEWED: "VIEWED",
  STATUS_CHANGED: "STATUS_CHANGED",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_DELETED: "DOCUMENT_DELETED",
  ASSIGNED: "ASSIGNED",
  VIEW_MODE_PRIVILEGED: "VIEW_MODE_PRIVILEGED",
  VIEW_MODE_REDACTED: "VIEW_MODE_REDACTED",
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  [AUDIT_ACTIONS.CREATED]: { label: "Application Submitted", color: "bg-emerald-500" },
  [AUDIT_ACTIONS.VIEWED]: { label: "Viewed", color: "bg-blue-500" },
  [AUDIT_ACTIONS.STATUS_CHANGED]: { label: "Status Changed", color: "bg-amber-500" },
  [AUDIT_ACTIONS.DOCUMENT_UPLOADED]: { label: "Document Uploaded", color: "bg-blue-500" },
  [AUDIT_ACTIONS.DOCUMENT_DELETED]: { label: "Document Deleted", color: "bg-red-500" },
  [AUDIT_ACTIONS.ASSIGNED]: { label: "Assigned", color: "bg-blue-500" },
  [AUDIT_ACTIONS.VIEW_MODE_PRIVILEGED]: { label: "Viewed Full PII", color: "bg-purple-500" },
  [AUDIT_ACTIONS.VIEW_MODE_REDACTED]: { label: "Switched to Redacted", color: "bg-gray-500" },
};

export function getAuditActionInfo(action: string): { label: string; color: string } {
  return AUDIT_ACTION_CONFIG[action] || { label: action, color: "bg-gray-500" };
}

export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_CONFIG[action]?.label || action;
}

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type TimeRangePreset = 
  | "all" 
  | "30min" 
  | "1hour" 
  | "3hours" 
  | "6hours" 
  | "24hours" 
  | "3days" 
  | "week" 
  | "14days" 
  | "30days" 
  | "custom";

export const TIME_RANGE_OPTIONS: { value: TimeRangePreset; label: string }[] = [
  { value: "all", label: "Time" },
  { value: "30min", label: "Past 30 minutes" },
  { value: "1hour", label: "Past hour" },
  { value: "3hours", label: "Past 3 hours" },
  { value: "6hours", label: "Past 6 hours" },
  { value: "24hours", label: "Past 24 hours" },
  { value: "3days", label: "Past 3 days" },
  { value: "week", label: "Past 7 days" },
  { value: "14days", label: "Past 14 days" },
  { value: "30days", label: "Past 30 days" },
  { value: "custom", label: "Custom range" },
];

export const STORAGE_KEYS = {
  USER: "user",
} as const;

export const COOKIE_NAMES = {
  SESSION: "session",
  USER_ID: "userId",
} as const;
