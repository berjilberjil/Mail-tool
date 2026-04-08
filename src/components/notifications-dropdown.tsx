"use client";

import { useState, useEffect } from "react";
import { Bell, Send, UserPlus, FileText, Trash2, Settings } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAuditLog } from "@/lib/actions/team";
import { formatDistanceToNow } from "date-fns";

type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: Date;
  userName: string;
  userEmail: string;
};

const actionLabels: Record<string, string> = {
  "campaign.created": "created a campaign",
  "campaign.sent": "sent a campaign",
  "campaign.resend_non_openers": "resent to non-openers",
  "member.invited": "invited a team member",
  "member.removed": "removed a team member",
  "member.role_changed": "changed a member's role",
  "invitation.revoked": "revoked an invitation",
  "list.created": "created a recipient list",
  "recipients.imported": "imported recipients",
};

const actionIcons: Record<string, typeof Send> = {
  "campaign.created": FileText,
  "campaign.sent": Send,
  "campaign.resend_non_openers": Send,
  "member.invited": UserPlus,
  "member.removed": Trash2,
  "member.role_changed": Settings,
  "invitation.revoked": Trash2,
  "list.created": FileText,
  "recipients.imported": FileText,
};

export function NotificationsDropdown() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (open && !loaded) {
      getAuditLog()
        .then((data) => {
          setEntries(data as AuditEntry[]);
          setLoaded(true);
        })
        .catch(() => {});
    }
  }, [open, loaded]);

  // Refresh on open
  useEffect(() => {
    if (open) {
      getAuditLog()
        .then((data) => setEntries(data as AuditEntry[]))
        .catch(() => {});
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent cursor-pointer relative">
        <Bell className="h-4 w-4" />
        {!loaded && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Activity</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No recent activity
            </div>
          ) : (
            entries.slice(0, 20).map((entry) => {
              const Icon = actionIcons[entry.action] || FileText;
              const label = actionLabels[entry.action] || entry.action;
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{entry.userName}</span>{" "}
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
