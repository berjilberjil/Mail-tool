"use client";

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

const stats = [
  {
    label: "Total Sent",
    value: "12,458",
    change: "+2,340 this month",
    icon: Send,
    color: "text-blue-500",
  },
  {
    label: "Total Opens",
    value: "8,721",
    change: "70% open rate",
    icon: Eye,
    color: "text-green-500",
  },
  {
    label: "Total Clicks",
    value: "3,210",
    change: "26% click rate",
    icon: MousePointerClick,
    color: "text-purple-500",
  },
  {
    label: "Bounce Rate",
    value: "1.2%",
    change: "Healthy",
    icon: AlertTriangle,
    color: "text-yellow-500",
  },
];

const openTrend = [
  { date: "Mar 1", opens: 120 },
  { date: "Mar 5", opens: 340 },
  { date: "Mar 10", opens: 280 },
  { date: "Mar 15", opens: 520 },
  { date: "Mar 20", opens: 410 },
  { date: "Mar 25", opens: 680 },
  { date: "Mar 30", opens: 590 },
  { date: "Apr 1", opens: 720 },
  { date: "Apr 5", opens: 850 },
];

const recentCampaigns = [
  {
    name: "Q2 Product Launch",
    sent: 2400,
    opened: 1680,
    status: "sent",
    date: "Apr 5",
  },
  {
    name: "April Newsletter",
    sent: 1800,
    opened: 1200,
    status: "sent",
    date: "Apr 3",
  },
  {
    name: "Feature Announcement",
    sent: 3200,
    opened: 2100,
    status: "sent",
    date: "Apr 1",
  },
  {
    name: "Webinar Invite",
    sent: 0,
    opened: 0,
    status: "scheduled",
    date: "Apr 10",
  },
];

const activityFeed = [
  {
    text: "Priya from Infosys opened Q2 Product Launch",
    time: "2 mins ago",
  },
  {
    text: "Rahul from Tata clicked pricing link in April Newsletter",
    time: "5 mins ago",
  },
  {
    text: "3 people from Wipro opened Feature Announcement",
    time: "12 mins ago",
  },
  {
    text: "Ananya from Zoho unsubscribed from Q2 Product Launch",
    time: "18 mins ago",
  },
  {
    text: "Karthik from Freshworks opened April Newsletter",
    time: "25 mins ago",
  },
  {
    text: "Deepa from HCL clicked demo link in Feature Announcement",
    time: "32 mins ago",
  },
  {
    text: "5 new opens on Q2 Product Launch",
    time: "40 mins ago",
  },
];

export default function DashboardPage() {
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
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
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
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={openTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
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
              <div className="space-y-0 divide-y">
                {activityFeed.map((item, i) => (
                  <div key={i} className="px-6 py-3">
                    <p className="text-sm">{item.text}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {item.time}
                    </p>
                  </div>
                ))}
              </div>
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
            {recentCampaigns.map((campaign) => (
              <div
                key={campaign.name}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {campaign.status === "scheduled"
                      ? `Scheduled for ${campaign.date}`
                      : `${campaign.sent.toLocaleString()} sent · ${campaign.opened.toLocaleString()} opened`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      campaign.status === "sent" ? "default" : "secondary"
                    }
                  >
                    {campaign.status}
                  </Badge>
                  {campaign.sent > 0 && (
                    <span className="text-sm font-medium text-green-600">
                      {Math.round((campaign.opened / campaign.sent) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium">Bounce Rate</p>
                <p className="text-xs text-muted-foreground">1.2% — Healthy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium">Open Rate</p>
                <p className="text-xs text-muted-foreground">70% — Excellent</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium">Complaint Rate</p>
                <p className="text-xs text-muted-foreground">0.01% — Healthy</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
