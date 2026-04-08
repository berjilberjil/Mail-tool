"use client";

import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  Send,
  Clock,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const campaigns = [
  {
    id: "1",
    name: "Q2 Product Launch",
    status: "sent",
    sent: 2400,
    delivered: 2380,
    opened: 1680,
    clicked: 620,
    bounced: 20,
    tags: ["product", "launch"],
    sentAt: "Apr 5, 2026",
    createdBy: "Varun Raj",
  },
  {
    id: "2",
    name: "April Newsletter",
    status: "sent",
    sent: 1800,
    delivered: 1790,
    opened: 1200,
    clicked: 480,
    bounced: 10,
    tags: ["newsletter"],
    sentAt: "Apr 3, 2026",
    createdBy: "Varun Raj",
  },
  {
    id: "3",
    name: "Feature Announcement",
    status: "sent",
    sent: 3200,
    delivered: 3180,
    opened: 2100,
    clicked: 890,
    bounced: 20,
    tags: ["product"],
    sentAt: "Apr 1, 2026",
    createdBy: "Priya S",
  },
  {
    id: "4",
    name: "Webinar Invite — AI in SaaS",
    status: "scheduled",
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    tags: ["webinar"],
    sentAt: "Apr 10, 2026",
    createdBy: "Varun Raj",
  },
  {
    id: "5",
    name: "March Digest",
    status: "draft",
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    tags: ["newsletter"],
    sentAt: "—",
    createdBy: "Karthik M",
  },
];

const statusColor: Record<string, string> = {
  sent: "default",
  draft: "secondary",
  scheduled: "outline",
  sending: "default",
  paused: "secondary",
  failed: "destructive",
};

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Create, manage, and track your email campaigns
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search campaigns..." className="pl-9" />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" size="sm">
              <Tag className="mr-2 h-4 w-4" /> Tags
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Opened</TableHead>
                <TableHead className="text-right">Clicked</TableHead>
                <TableHead className="text-right">Open Rate</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                    <div className="mt-1 flex gap-1">
                      {c.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor[c.status] as "default" | "secondary" | "outline" | "destructive"}>
                      {c.status === "scheduled" && (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {c.status === "sent" && (
                        <Send className="mr-1 h-3 w-3" />
                      )}
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {c.sent > 0 ? c.sent.toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.opened > 0 ? c.opened.toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.clicked > 0 ? c.clicked.toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.sent > 0
                      ? `${Math.round((c.opened / c.sent) * 100)}%`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.sentAt}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" /> View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="mr-2 h-4 w-4" /> Resend to Non-Openers
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
