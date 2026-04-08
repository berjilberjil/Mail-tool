"use client";

import { Clock, Send, UserPlus, UserMinus, CreditCard, FileText, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const auditLog = [
  {
    action: "campaign.sent",
    description: 'Campaign "Q2 Product Launch" was sent to 2,400 recipients',
    user: "Varun Raj",
    initials: "VR",
    time: "Apr 5, 2026 — 2:00 PM",
    icon: Send,
  },
  {
    action: "campaign.created",
    description: 'Campaign "Webinar Invite — AI in SaaS" was created',
    user: "Varun Raj",
    initials: "VR",
    time: "Apr 4, 2026 — 11:30 AM",
    icon: FileText,
  },
  {
    action: "member.invited",
    description: "rahul@skcript.com was invited as Member",
    user: "Varun Raj",
    initials: "VR",
    time: "Apr 3, 2026 — 4:15 PM",
    icon: UserPlus,
  },
  {
    action: "campaign.sent",
    description: 'Campaign "April Newsletter" was sent to 1,800 recipients',
    user: "Varun Raj",
    initials: "VR",
    time: "Apr 3, 2026 — 10:00 AM",
    icon: Send,
  },
  {
    action: "member.joined",
    description: "Deepa R joined the organisation as Member",
    user: "Deepa R",
    initials: "DR",
    time: "Mar 30, 2026 — 9:45 AM",
    icon: UserPlus,
  },
  {
    action: "campaign.sent",
    description: 'Campaign "Feature Announcement" was sent to 3,200 recipients',
    user: "Priya S",
    initials: "PS",
    time: "Apr 1, 2026 — 1:00 PM",
    icon: Send,
  },
  {
    action: "plan.changed",
    description: "Organisation plan changed from Free to Pro",
    user: "Varun Raj",
    initials: "VR",
    time: "Mar 15, 2026 — 3:30 PM",
    icon: CreditCard,
  },
  {
    action: "member.removed",
    description: "alex@skcript.com was removed from the organisation",
    user: "Varun Raj",
    initials: "VR",
    time: "Mar 10, 2026 — 2:00 PM",
    icon: UserMinus,
  },
  {
    action: "settings.updated",
    description: "Default from email changed to hello@skcript.com",
    user: "Varun Raj",
    initials: "VR",
    time: "Mar 5, 2026 — 11:00 AM",
    icon: Settings,
  },
];

const actionColor: Record<string, string> = {
  "campaign.sent": "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "campaign.created": "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  "member.invited": "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  "member.joined": "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  "member.removed": "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  "plan.changed": "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  "settings.updated": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function ActivitySettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {auditLog.map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-4 border-b py-4 last:border-0"
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    actionColor[entry.action] || "bg-muted text-muted-foreground"
                  }`}
                >
                  <entry.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{entry.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[8px]">
                          {entry.initials}
                        </AvatarFallback>
                      </Avatar>
                      {entry.user}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.time}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {entry.action}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
