"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Send,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Download,
  Copy,
  Clock,
  Building2,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getCampaign,
  getCampaignStats,
  getCampaignRecipients,
  getCampaignOrgRollup,
  getCampaignTimeline,
  duplicateCampaign,
  exportCampaignCSV,
  resendToNonOpeners,
} from "@/lib/actions/campaigns";

type Campaign = NonNullable<Awaited<ReturnType<typeof getCampaign>>>;
type Stats = Awaited<ReturnType<typeof getCampaignStats>>;
type Recipient = Awaited<ReturnType<typeof getCampaignRecipients>>[number];
type OrgRow = Awaited<ReturnType<typeof getCampaignOrgRollup>>[number];
type TimelineRow = Awaited<ReturnType<typeof getCampaignTimeline>>[number];

const engagementColor: Record<string, string> = {
  hot: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  warm: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  cold: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

function engagementLabel(score: number | null): string {
  if (score === null || score === undefined) return "cold";
  if (score >= 70) return "hot";
  if (score >= 30) return "warm";
  return "cold";
}

const statusColor: Record<string, string> = {
  sent: "default",
  draft: "secondary",
  scheduled: "outline",
  sending: "default",
  paused: "secondary",
  failed: "destructive",
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [orgRollup, setOrgRollup] = useState<OrgRow[]>([]);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [campaignData, statsData, recipientsData, orgData, timelineData] =
        await Promise.all([
          getCampaign(campaignId),
          getCampaignStats(campaignId),
          getCampaignRecipients(campaignId),
          getCampaignOrgRollup(campaignId),
          getCampaignTimeline(campaignId),
        ]);

      setCampaign(campaignData);
      setStats(statsData);
      setRecipients(recipientsData);
      setOrgRollup(orgData);
      setTimeline(timelineData);

      return campaignData;
    } catch (err) {
      console.error("Failed to fetch campaign data:", err);
      return null;
    }
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId) return;

    const init = async () => {
      const data = await fetchAll();
      setLoading(false);

      // Start polling if campaign is currently sending
      if (data?.status === "sending") {
        pollRef.current = setInterval(async () => {
          const updated = await fetchAll();
          if (updated && updated.status !== "sending") {
            // Campaign finished — stop polling
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }, 3000);
      }
    };

    init();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [campaignId, fetchAll]);

  const handleDuplicate = async () => {
    try {
      await duplicateCampaign(campaignId);
    } catch (err) {
      console.error("Failed to duplicate campaign:", err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const csv = await exportCampaignCSV(campaignId);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${campaign?.name || "campaign"}-recipients.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export CSV:", err);
    }
  };

  const handleResendNonOpeners = async () => {
    try {
      const newCampaign = await resendToNonOpeners(campaignId);
      router.push(`/campaigns/${newCampaign.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend";
      alert(message);
    }
  };

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "\u2014";
    return format(new Date(date), "MMM d, h:mm a");
  };

  const formatFullDateTime = (date: Date | string | null) => {
    if (!date) return "\u2014";
    return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
  };

  const chartData = timeline.map((t) => ({
    time: format(new Date(t.hour), "h:mm a"),
    opens: t.opens,
    clicks: t.clicks,
  }));

  const openedRecipients = recipients.filter((r) => r.openCount > 0);
  const bouncedRecipients = recipients.filter((r) => r.status === "bounced");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <p>Campaign not found.</p>
        <Link href="/campaigns" className="mt-4">
          <Button variant="outline">Back to Campaigns</Button>
        </Link>
      </div>
    );
  }

  const openRate =
    stats && stats.sent > 0
      ? Math.round((stats.opened / stats.sent) * 100)
      : 0;
  const clickRate =
    stats && stats.sent > 0
      ? Math.round((stats.clicked / stats.sent) * 100)
      : 0;
  const bounceRate =
    stats && stats.sent > 0
      ? ((stats.bounced / stats.sent) * 100).toFixed(1)
      : "0";

  const campaignStats = [
    {
      label: "Sent",
      value: stats?.sent?.toLocaleString() ?? "0",
      icon: Send,
      color: "text-blue-500",
    },
    {
      label: "Opened",
      value: stats?.opened?.toLocaleString() ?? "0",
      icon: Eye,
      color: "text-green-500",
    },
    {
      label: "Clicked",
      value: stats?.clicked?.toLocaleString() ?? "0",
      icon: MousePointerClick,
      color: "text-purple-500",
    },
    {
      label: "Bounced",
      value: stats?.bounced?.toLocaleString() ?? "0",
      icon: AlertTriangle,
      color: "text-red-500",
    },
  ];

  const errorMessage = (campaign.statsCache as { errorMessage?: string } | null)?.errorMessage;

  return (
    <div className="space-y-6">
      {/* Failed campaign error banner */}
      {campaign.status === "failed" && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Campaign failed to send</p>
              {errorMessage ? (
                <p className="mt-1 text-sm text-destructive/80">{errorMessage}</p>
              ) : (
                <p className="mt-1 text-sm text-destructive/80">
                  All recipients failed. Check that your Resend sender domain is verified.
                </p>
              )}
              {errorMessage?.includes("onboarding@resend.dev") || errorMessage?.includes("can only send") ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Tip: The Resend free tier can only send to the email address you signed up with.
                  To send to other recipients, verify your own domain in the{" "}
                  <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                    Resend dashboard
                  </a>.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{campaign.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant={
                  statusColor[campaign.status] as
                    | "default"
                    | "secondary"
                    | "outline"
                    | "destructive"
                }
              >
                {campaign.status}
              </Badge>
              {campaign.sentAt && (
                <span>Sent on {formatFullDateTime(campaign.sentAt)}</span>
              )}
              {!campaign.sentAt && campaign.scheduledAt && (
                <span>
                  Scheduled for {formatFullDateTime(campaign.scheduledAt)}
                </span>
              )}
              {!campaign.sentAt && !campaign.scheduledAt && (
                <span>
                  Created {formatFullDateTime(campaign.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </Button>
          {campaign.status === "sent" && (
            <Button size="sm" onClick={handleResendNonOpeners}>
              <Send className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Resend to Non-Openers</span><span className="sm:hidden">Resend</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {campaignStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              {stat.label === "Opened" && (
                <p className="mt-1 text-xs text-green-600">
                  {openRate}% open rate
                </p>
              )}
              {stat.label === "Clicked" && (
                <p className="mt-1 text-xs text-purple-600">
                  {clickRate}% click rate
                </p>
              )}
              {stat.label === "Bounced" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {bounceRate}% bounce rate
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="opens">
        <TabsList>
          <TabsTrigger value="opens">
            <Eye className="mr-2 h-4 w-4" /> Opens Timeline
          </TabsTrigger>
          <TabsTrigger value="recipients">
            <Send className="mr-2 h-4 w-4" /> Individual Opens
          </TabsTrigger>
          <TabsTrigger value="orgs">
            <Building2 className="mr-2 h-4 w-4" /> Org Rollup
          </TabsTrigger>
          <TabsTrigger value="bounces">
            <AlertTriangle className="mr-2 h-4 w-4" /> Bounces
          </TabsTrigger>
        </TabsList>

        {/* Opens timeline chart */}
        <TabsContent value="opens">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">
                Opens Over Time
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                  No timeline data available yet.
                </div>
              ) : (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="opens"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual opens */}
        <TabsContent value="recipients">
          <Card>
            <CardContent className="p-0">
              {openedRecipients.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                  No opens recorded yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Organisation</TableHead>
                      <TableHead>Opened At</TableHead>
                      <TableHead className="text-center">Opens</TableHead>
                      <TableHead className="text-center">Clicked</TableHead>
                      <TableHead>Engagement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openedRecipients.map((r) => {
                      const engagement = engagementLabel(r.recipientEngagement);
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {[r.recipientFirstName, r.recipientLastName]
                              .filter(Boolean)
                              .join(" ") || "\u2014"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.recipientEmail}
                          </TableCell>
                          <TableCell>
                            {r.recipientCompany ? (
                              <Badge variant="outline">
                                {r.recipientCompany}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">
                                \u2014
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />{" "}
                              {formatDateTime(r.firstOpenedAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {r.openCount}
                          </TableCell>
                          <TableCell className="text-center">
                            {r.clickCount > 0 ? (
                              <MousePointerClick className="mx-auto h-4 w-4 text-purple-500" />
                            ) : (
                              <span className="text-muted-foreground">
                                \u2014
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                engagementColor[engagement] || engagementColor.cold
                              }`}
                            >
                              {engagement}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Org rollup */}
        <TabsContent value="orgs">
          <Card>
            <CardContent className="p-0">
              {orgRollup.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                  No organisation data available.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organisation</TableHead>
                      <TableHead className="text-center">
                        Total Recipients
                      </TableHead>
                      <TableHead className="text-center">Opened</TableHead>
                      <TableHead>First Open</TableHead>
                      <TableHead>Last Open</TableHead>
                      <TableHead className="text-center">Open Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgRollup.map((org) => {
                      const rate =
                        org.total > 0
                          ? Math.round((org.opened / org.total) * 100)
                          : 0;
                      return (
                        <TableRow key={org.company}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {org.company || "Unknown"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {org.total}
                          </TableCell>
                          <TableCell className="text-center">
                            {org.opened}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(org.firstOpen)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(org.lastOpen)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`font-medium ${
                                rate >= 70
                                  ? "text-green-600"
                                  : rate >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {rate}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bounces */}
        <TabsContent value="bounces">
          <Card>
            <CardContent className="p-0">
              {bouncedRecipients.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                  No bounces recorded.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Bounced At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bouncedRecipients.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">
                          {b.recipientEmail}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              b.bounceType === "hard"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {b.bounceType || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(b.bouncedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
