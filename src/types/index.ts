// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  defaultTimezone: string;
  locale: string;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

// ─── Organization ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  status: string;
  createdAt: string;
}

export interface OrgMembership {
  organization: Organization;
  role: MemberRole;
  joinedAt: string;
}

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

// ─── Project ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  clientName: string | null;
  colorTag: string | null;
  status: string;
  createdAt: string;
}

// ─── Asset ────────────────────────────────────────────────────────────────────

export type AssetType =
  | "DOMAIN"
  | "SERVER"
  | "SSL_CERTIFICATE"
  | "LICENSE"
  | "HOSTING_SERVICE"
  | "CDN_SERVICE"
  | "CUSTOM";

export type AssetStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "CANCELLED"
  | "ARCHIVED";

export interface Asset {
  id: string;
  organizationId: string;
  projectId: string | null;
  assetType: AssetType;
  name: string;
  vendorName: string | null;
  status: AssetStatus;
  renewalDate: string; // ISO date string (UTC)
  renewalIntervalUnit: string | null;
  renewalIntervalValue: number | null;
  autoRenewEnabled: boolean;
  priceAmount: string | null;
  priceCurrency: string;
  assignedUserId: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  lastRenewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string; colorTag: string | null } | null;
  assignedUser: { id: string; fullName: string; email: string; avatarUrl: string | null } | null;
}

export interface AssetWithDays extends Asset {
  daysUntilRenewal?: number;
  daysOverdue?: number;
}

export interface CreateAssetDto {
  assetType: AssetType;
  name: string;
  vendorName?: string;
  renewalDate: string;
  priceAmount?: string;
  priceCurrency?: string;
  projectId?: string;
  assignedUserId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// ─── Renewal ──────────────────────────────────────────────────────────────────

export interface RenewalSummary {
  total: number;
  expired: number;
  expiringIn7Days: number;
  expiringIn30Days: number;
}

export interface RenewalEvent {
  id: string;
  assetId: string;
  eventType: string;
  eventDate: string;
  oldRenewalDate: string | null;
  newRenewalDate: string | null;
  performedByUserId: string | null;
  notes: string | null;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  assetId: string | null;
  channel: "EMAIL" | "PUSH" | "SMS" | "WHATSAPP";
  notificationType: string;
  subject: string | null;
  body: string | null;
  status: "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "READ";
  scheduledFor: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
  asset?: { name: string; assetType: string } | null;
}

// ─── Team ────────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  organizationId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    status: string;
  };
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

/** Maps backend AssetType → short display label */
export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  DOMAIN: "DOMAIN",
  SERVER: "SERVER",
  SSL_CERTIFICATE: "SSL",
  LICENSE: "LICENSE",
  HOSTING_SERVICE: "HOSTING",
  CDN_SERVICE: "CDN",
  CUSTOM: "CUSTOM",
};

/** Maps backend AssetStatus → UI display */
export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = {
  ACTIVE: "Active",
  EXPIRING_SOON: "Expiring Soon",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  ARCHIVED: "Archived",
};

export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  DOMAIN: "text-primary",
  SERVER: "text-info",
  SSL_CERTIFICATE: "text-info",
  LICENSE: "text-warning",
  HOSTING_SERVICE: "text-info",
  CDN_SERVICE: "text-success",
  CUSTOM: "text-muted-foreground",
};

export const ASSET_STATUS_DISPLAY: Record<AssetStatus, { dot: string; text: string }> = {
  ACTIVE: { dot: "bg-success", text: "text-success" },
  EXPIRING_SOON: { dot: "bg-warning", text: "text-warning" },
  EXPIRED: { dot: "bg-destructive", text: "text-destructive" },
  CANCELLED: { dot: "bg-muted-foreground", text: "text-muted-foreground" },
  ARCHIVED: { dot: "bg-muted-foreground", text: "text-muted-foreground" },
};
