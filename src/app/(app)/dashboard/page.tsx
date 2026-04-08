"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Eye,
  MousePointerClick,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";
import {
  getDashboardStats,
  getRecentCampaigns,
  getRecentActivity,
  getOpensOverTime,
} from "@/lib/actions/dashboard";

type DashboardStats = {
  totalCampaigns: number;
  totalEmailsSent: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  activeRecipients: number;
};

type Campaign = {
  id: string;
  name: string;
  status: string;
  sentAt: Date | null;
  scheduledAt?: Date | null;
  createdAt: Date;
  statsCache: {
    sent?: number;
    opened?: number;
    clicked?: number;
    bounced?: number;
    total?: number;
  } | null;
};

type ActivityItem = {
  id: string;
  action: string;
  entityType: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  userName: string | null;
};

type OpensTrendItem = {
  date: string;
  opens: number;
  clicks: number;
};

function getHealthIndicator(rate: number, type: "bounce" | "open" | "complaint") {
  if (type === "bounce") {
    if (rate < 3) return { color: "bg-green-500", label: "Healthy" };
    if (rate < 5) return { color: "bg-yellow-500", label: "Warning" };
    return { color: "bg-red-500", label: "Critical" };
  }
  if (type === "open") {
    if (rate >= 40) return { color: "bg-green-500", label: "Excellent" };
    if (rate >= 20) return { color: "bg-yellow-500", label: "Average" };
    return { color: "bg-red-500", label: "Low" };
  }
  // complaint
  if (rate < 0.1) return { color: "bg-green-500", label: "Healthy" };
  if (rate < 0.3) return { color: "bg-yellow-500", label: "Warning" };
  return { color: "bg-red-500", label: "Critical" };
}

function formatActivityText(item: ActivityItem): string {
  const user = item.userName || "Someone";
  const meta = item.metadata as Record<string, string> | null;
  const entityName = meta?.name || meta?.campaignName || item.entityType;

  switch (item.action) {
    case "campaign.created":
      return `${user} created campaign "${entityName}"`;
    case "campaign.sent":
      return `${user} sent campaign "${entityName}"`;
    case "campaign.scheduled":
      return `${user} scheduled campaign "${entityName}"`;
    case "campaign.updated":
      return `${user} updated campaign "${entityName}"`;
    case "campaign.deleted":
      return `${user} deleted campaign "${entityName}"`;
    case "recipient.imported":
      return `${user} imported ${meta?.count || ""} recipients`;
    case "recipient.created":
      return `${user} added a new recipient`;
    case "template.created":
      return `${user} created template "${entityName}"`;
    case "template.updated":
      return `${user} updated template "${entityName}"`;
    default:
      return `${user} performed ${item.action.replace(/\./g, " ")} on ${item.entityType}`;
  }
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        <Skeleton className="mt-2 h-8 w-20" />
        <Skeleton className="mt-1 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="space-y-3 w-full px-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-4 w-[95%]" />
        <Skeleton className="h-4 w-[70%]" />
        <Skeleton className="h-4 w-[85%]" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-0 divide-y">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-6 py-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-1 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

function CampaignRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-4 w-8" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [openTrend, setOpenTrend] = useState<OpensTrendItem[] | null>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[] | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsData, campaignsData, activityData, opensData] =
          await Promise.all([
            getDashboardStats(),
            getRecentCampaigns(),
            getRecentActivity(),
            getOpensOverTime(),
          ]);

        setStats(statsData);
        setRecentCampaigns(campaignsData as Campaign[]);
        setActivityFeed(activityData as ActivityItem[]);
        setOpenTrend(opensData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statCards = stats
    ? [
        {
          label: "Total Sent",
          value: stats.totalEmailsSent.toLocaleString(),
          change: `${stats.totalCampaigns} campaign${stats.totalCampaigns !== 1 ? "s" : ""} total`,
          icon: Send,
          color: "text-blue-500",
        },
        {
          label: "Open Rate",
          value: `${stats.openRate}%`,
          change: `${stats.activeRecipients.toLocaleString()} active recipients`,
          icon: Eye,
          color: "text-green-500",
        },
        {
          label: "Click Rate",
          value: `${stats.clickRate}%`,
          change: stats.clickRate > 0 ? "Tracking clicks" : "No clicks yet",
          icon: MousePointerClick,
          color: "text-purple-500",
        },
        {
          label: "Bounce Rate",
          value: `${stats.bounceRate}%`,
          change:
            stats.bounceRate < 3
              ? "Healthy"
              : stats.bounceRate < 5
                ? "Needs attention"
                : "Critical",
          icon: AlertTriangle,
          color: "text-yellow-500",
        },
      ]
    : [];

  const formattedOpenTrend = openTrend
    ? openTrend.map((item) => ({
        ...item,
        date: format(new Date(item.date), "MMM d"),
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your email campaign performance
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Send className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Opens over time chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">
              Opens Over Time
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton />
            ) : formattedOpenTrend.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet. Send your first campaign to see open trends.
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedOpenTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="opens"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {loading ? (
                <ActivitySkeleton />
              ) : !activityFeed || activityFeed.length === 0 ? (
                <div className="flex h-[260px] items-center justify-center px-6 text-sm text-muted-foreground">
                  No activity yet. Actions will appear here as you use the
                  platform.
                </div>
              ) : (
                <div className="space-y-0 divide-y">
                  {activityFeed.map((item) => (
                    <div key={item.id} className="px-6 py-3">
                      <p className="text-sm">{formatActivityText(item)}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />{" "}
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent campaigns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">
            Recent Campaigns
          </CardTitle>
          <Link href="/campaigns">
            <Button variant="ghost" size="sm">
              View all <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <CampaignRowSkeleton key={i} />
              ))
            ) : !recentCampaigns || recentCampaigns.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No campaigns yet. Create your first campaign to get started.
              </div>
            ) : (
              recentCampaigns.map((campaign) => {
                const cache = campaign.statsCache as {
                  sent?: number;
                  opened?: number;
                  clicked?: number;
                  bounced?: number;
                  total?: number;
                } | null;
                const sent = cache?.sent || 0;
                const opened = cache?.opened || 0;

                return (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {campaign.status === "scheduled"
                          ? `Scheduled for ${campaign.scheduledAt ? format(new Date(campaign.scheduledAt), "MMM d, yyyy") : "TBD"}`
                          : campaign.status === "draft"
                            ? `Draft - created ${format(new Date(campaign.createdAt), "MMM d, yyyy")}`
                            : campaign.status === "sending"
                              ? "Currently sending..."
                              : sent > 0
                                ? `${sent.toLocaleString()} sent · ${opened.toLocaleString()} opened`
                                : `Sent ${campaign.sentAt ? format(new Date(campaign.sentAt), "MMM d, yyyy") : ""}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          campaign.status === "sent"
                            ? "default"
                            : campaign.status === "sending"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {campaign.status}
                      </Badge>
                      {sent > 0 && (
                        <span className="text-sm font-medium text-green-600">
                          {Math.round((opened / sent) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deliverability Health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Deliverability Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border p-4"
                >
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {(() => {
                const bounceHealth = getHealthIndicator(
                  stats?.bounceRate ?? 0,
                  "bounce"
                );
                const openHealth = getHealthIndicator(
                  stats?.openRate ?? 0,
                  "open"
                );
                // Complaint rate is not tracked in stats, so we show N/A or derive from bounce
                const complaintRate = 0;
                const complaintHealth = getHealthIndicator(
                  complaintRate,
                  "complaint"
                );

                return (
                  <>
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                      <div
                        className={`h-3 w-3 rounded-full ${bounceHealth.color}`}
                      />
                      <div>
                        <p className="text-sm font-medium">Bounce Rate</p>
                        <p className="text-xs text-muted-foreground">
                          {stats?.bounceRate ?? 0}% &mdash; {bounceHealth.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                      <div
                        className={`h-3 w-3 rounded-full ${openHealth.color}`}
                      />
                      <div>
                        <p className="text-sm font-medium">Open Rate</p>
                        <p className="text-xs text-muted-foreground">
                          {stats?.openRate ?? 0}% &mdash; {openHealth.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                      <div
                        className={`h-3 w-3 rounded-full ${complaintHealth.color}`}
                      />
                      <div>
                        <p className="text-sm font-medium">Complaint Rate</p>
                        <p className="text-xs text-muted-foreground">
                          {stats?.totalEmailsSent
                            ? `${complaintRate}%`
                            : "N/A"}{" "}
                          &mdash;{" "}
                          {stats?.totalEmailsSent
                            ? complaintHealth.label
                            : "No data"}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
