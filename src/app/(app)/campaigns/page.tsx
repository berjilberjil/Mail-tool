"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
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
  Loader2,
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
import {
  getCampaigns,
  duplicateCampaign,
  deleteCampaign,
} from "@/lib/actions/campaigns";

type Campaign = Awaited<ReturnType<typeof getCampaigns>>[number];

const statusColor: Record<string, string> = {
  sent: "default",
  draft: "secondary",
  scheduled: "outline",
  sending: "default",
  paused: "secondary",
  failed: "destructive",
};

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCampaigns = async () => {
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDuplicate = async (campaignId: string) => {
    try {
      await duplicateCampaign(campaignId);
      await fetchCampaigns();
    } catch (err) {
      console.error("Failed to duplicate campaign:", err);
    }
  };

  const handleDelete = async (campaignId: string) => {
    try {
      await deleteCampaign(campaignId);
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    } catch (err) {
      console.error("Failed to delete campaign:", err);
    }
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStats = (c: Campaign) => {
    const cache = c.statsCache as {
      sent?: number;
      opened?: number;
      clicked?: number;
      bounced?: number;
      total?: number;
      unique_opens?: number;
      unique_clicks?: number;
    } | null;
    return {
      sent: cache?.sent ?? 0,
      opened: cache?.unique_opens ?? cache?.opened ?? 0,
      clicked: cache?.unique_clicks ?? cache?.clicked ?? 0,
      bounced: cache?.bounced ?? 0,
      total: cache?.total ?? 0,
    };
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "\u2014";
    return format(new Date(date), "MMM d, yyyy");
  };

  const tags = (c: Campaign): string[] => {
    if (Array.isArray(c.tags)) return c.tags as string[];
    return [];
  };

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
              <Input
                placeholder="Search campaigns..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p className="text-sm">
                {searchQuery ? "No campaigns match your search." : "No campaigns yet. Create your first one!"}
              </p>
            </div>
          ) : (
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
                {filteredCampaigns.map((c) => {
                  const stats = getStats(c);
                  const campaignTags = tags(c);
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="font-medium hover:underline"
                        >
                          {c.name}
                        </Link>
                        {campaignTags.length > 0 && (
                          <div className="mt-1 flex gap-1">
                            {campaignTags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusColor[c.status] as
                              | "default"
                              | "secondary"
                              | "outline"
                              | "destructive"
                          }
                        >
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
                        {stats.sent > 0 ? stats.sent.toLocaleString() : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right">
                        {stats.opened > 0 ? stats.opened.toLocaleString() : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right">
                        {stats.clicked > 0 ? stats.clicked.toLocaleString() : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right">
                        {stats.sent > 0
                          ? `${Math.round((stats.opened / stats.sent) * 100)}%`
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.sentAt
                          ? formatDate(c.sentAt)
                          : c.scheduledAt
                          ? formatDate(c.scheduledAt)
                          : formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/campaigns/${c.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(c.id)}
                            >
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" /> Resend to
                              Non-Openers
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(c.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
