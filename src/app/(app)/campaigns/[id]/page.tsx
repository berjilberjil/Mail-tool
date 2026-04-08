"use client";

import Link from "next/link";
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

const campaignStats = [
  { label: "Sent", value: "2,400", icon: Send, color: "text-blue-500" },
  { label: "Opened", value: "1,680", icon: Eye, color: "text-green-500" },
  { label: "Clicked", value: "620", icon: MousePointerClick, color: "text-purple-500" },
  { label: "Bounced", value: "20", icon: AlertTriangle, color: "text-red-500" },
];

const opensOverTime = [
  { time: "12:00", opens: 45 },
  { time: "13:00", opens: 180 },
  { time: "14:00", opens: 320 },
  { time: "15:00", opens: 280 },
  { time: "16:00", opens: 220 },
  { time: "17:00", opens: 180 },
  { time: "18:00", opens: 150 },
  { time: "19:00", opens: 120 },
  { time: "20:00", opens: 95 },
  { time: "21:00", opens: 50 },
  { time: "22:00", opens: 30 },
  { time: "23:00", opens: 10 },
];

const individualOpens = [
  { name: "Priya Sharma", email: "priya@infosys.com", org: "Infosys", openedAt: "Apr 5, 2:14 PM", opens: 3, clicked: true, engagement: "hot" },
  { name: "Rahul Mehta", email: "rahul@tata.com", org: "Tata", openedAt: "Apr 5, 2:22 PM", opens: 2, clicked: true, engagement: "hot" },
  { name: "Ananya Rao", email: "ananya@zoho.com", org: "Zoho", openedAt: "Apr 5, 2:45 PM", opens: 1, clicked: false, engagement: "warm" },
  { name: "Karthik Nair", email: "karthik@freshworks.com", org: "Freshworks", openedAt: "Apr 5, 3:10 PM", opens: 1, clicked: true, engagement: "warm" },
  { name: "Deepa Iyer", email: "deepa@hcl.com", org: "HCL", openedAt: "Apr 5, 3:32 PM", opens: 2, clicked: false, engagement: "warm" },
  { name: "Vikram Singh", email: "vikram@wipro.com", org: "Wipro", openedAt: "Apr 5, 4:01 PM", opens: 1, clicked: false, engagement: "cold" },
  { name: "Meera Pillai", email: "meera@infosys.com", org: "Infosys", openedAt: "Apr 5, 4:18 PM", opens: 1, clicked: true, engagement: "warm" },
  { name: "Amit Patel", email: "amit@tata.com", org: "Tata", openedAt: "Apr 5, 5:05 PM", opens: 1, clicked: false, engagement: "cold" },
];

const orgRollup = [
  { org: "Infosys", total: 8, opened: 6, firstOpen: "Apr 5, 2:14 PM", lastOpen: "Apr 5, 6:45 PM", rate: 75 },
  { org: "Tata", total: 12, opened: 8, firstOpen: "Apr 5, 2:22 PM", lastOpen: "Apr 5, 7:10 PM", rate: 67 },
  { org: "Zoho", total: 5, opened: 3, firstOpen: "Apr 5, 2:45 PM", lastOpen: "Apr 5, 5:30 PM", rate: 60 },
  { org: "Freshworks", total: 6, opened: 4, firstOpen: "Apr 5, 3:10 PM", lastOpen: "Apr 5, 6:00 PM", rate: 67 },
  { org: "HCL", total: 4, opened: 2, firstOpen: "Apr 5, 3:32 PM", lastOpen: "Apr 5, 4:50 PM", rate: 50 },
  { org: "Wipro", total: 10, opened: 5, firstOpen: "Apr 5, 4:01 PM", lastOpen: "Apr 5, 8:20 PM", rate: 50 },
];

const bounceList = [
  { email: "old@defunct.com", type: "hard", reason: "Mailbox does not exist" },
  { email: "temp@expired.org", type: "soft", reason: "Mailbox full" },
];

const engagementColor: Record<string, string> = {
  hot: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  warm: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  cold: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function CampaignDetailPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Q2 Product Launch</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="default">sent</Badge>
              <span>Sent on Apr 5, 2026 at 2:00 PM</span>
              <span>·</span>
              <span>by Varun Raj</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </Button>
          <Button size="sm">
            <Send className="mr-2 h-4 w-4" /> Resend to Non-Openers
          </Button>
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
                <p className="mt-1 text-xs text-green-600">70% open rate</p>
              )}
              {stat.label === "Clicked" && (
                <p className="mt-1 text-xs text-purple-600">26% click rate</p>
              )}
              {stat.label === "Bounced" && (
                <p className="mt-1 text-xs text-muted-foreground">0.8% bounce rate</p>
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
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={opensOverTime}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual opens */}
        <TabsContent value="recipients">
          <Card>
            <CardContent className="p-0">
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
                  {individualOpens.map((r) => (
                    <TableRow key={r.email}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.org}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {r.openedAt}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{r.opens}</TableCell>
                      <TableCell className="text-center">
                        {r.clicked ? (
                          <MousePointerClick className="mx-auto h-4 w-4 text-purple-500" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            engagementColor[r.engagement]
                          }`}
                        >
                          {r.engagement}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Org rollup */}
        <TabsContent value="orgs">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead className="text-center">Total Recipients</TableHead>
                    <TableHead className="text-center">Opened</TableHead>
                    <TableHead>First Open</TableHead>
                    <TableHead>Last Open</TableHead>
                    <TableHead className="text-center">Open Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgRollup.map((org) => (
                    <TableRow key={org.org}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{org.org}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{org.total}</TableCell>
                      <TableCell className="text-center">{org.opened}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {org.firstOpen}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {org.lastOpen}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-medium ${
                            org.rate >= 70
                              ? "text-green-600"
                              : org.rate >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {org.rate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bounces */}
        <TabsContent value="bounces">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bounceList.map((b) => (
                    <TableRow key={b.email}>
                      <TableCell className="font-medium">{b.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            b.type === "hard" ? "destructive" : "secondary"
                          }
                        >
                          {b.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
