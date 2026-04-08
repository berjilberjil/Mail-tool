"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Send,
  UserPlus,
  UserMinus,
  CreditCard,
  FileText,
  Settings,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuditLog } from "@/lib/actions/team";
import { format } from "date-fns";

type AuditEntry = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: string | null;
  createdAt: Date | null;
  userName: string;
  userEmail: string;
};

const actionIcons: Record<string, typeof Send> = {
  "campaign.sent": Send,
  "campaign.created": FileText,
  "campaign.updated": FileText,
  "campaign.deleted": FileText,
  "member.invited": UserPlus,
  "member.joined": UserPlus,
  "member.removed": UserMinus,
  "plan.changed": CreditCard,
  "settings.updated": Settings,
};

const actionColor: Record<string, string> = {
  "campaign.sent": "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "campaign.created": "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  "campaign.updated": "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  "campaign.deleted": "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  "member.invited": "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  "member.joined": "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  "member.removed": "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  "plan.changed": "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  "settings.updated": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function buildDescription(entry: AuditEntry): string {
  // Try to extract a human-readable description from metadata or fall back to action
  if (entry.metadata) {
    try {
      const meta = JSON.parse(entry.metadata);
      if (meta.description) return meta.description;
    } catch {
      // metadata is not valid JSON, ignore
    }
  }

  const parts = entry.action.split(".");
  const entity = parts[0] || "item";
  const verb = parts[1] || "updated";
  const entityLabel = entry.entityType || entity;
  const entityRef = entry.entityId ? ` (${entry.entityId.slice(0, 8)}...)` : "";

  return `${entityLabel} was ${verb}${entityRef}`;
}

export default function ActivitySettingsPage() {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAuditLog() {
      try {
        const data = await getAuditLog();
        setAuditEntries(data as AuditEntry[]);
      } catch {
        setError("Failed to load audit log.");
      } finally {
        setLoading(false);
      }
    }
    loadAuditLog();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28" />
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 border-b py-4 last:border-0"
                >
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          {auditEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-sm font-medium">No activity yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Actions performed by your team will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {auditEntries.map((entry) => {
                const IconComponent =
                  actionIcons[entry.action] || Settings;
                const colorClass =
                  actionColor[entry.action] ||
                  "bg-muted text-muted-foreground";
                const initials = entry.userName
                  ? getInitials(entry.userName)
                  : "??";
                const description = buildDescription(entry);
                const formattedTime = entry.createdAt
                  ? format(
                      new Date(entry.createdAt),
                      "MMM d, yyyy '\u2014' h:mm a"
                    )
                  : "";

                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 border-b py-4 last:border-0"
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{description}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px]">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          {entry.userName}
                        </div>
                        {formattedTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formattedTime}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs"
                    >
                      {entry.action}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
