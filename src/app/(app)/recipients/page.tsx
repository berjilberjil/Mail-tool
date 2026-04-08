"use client";

import Link from "next/link";
import { Plus, Search, Upload, Users, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const recipientLists = [
  {
    id: "1",
    name: "Enterprise Leads",
    description: "Top-tier enterprise prospects",
    count: 1240,
    active: 1180,
    unsubscribed: 35,
    bounced: 25,
    updatedAt: "Apr 5, 2026",
  },
  {
    id: "2",
    name: "Newsletter Subscribers",
    description: "All newsletter subscribers",
    count: 4580,
    active: 4320,
    unsubscribed: 180,
    bounced: 80,
    updatedAt: "Apr 3, 2026",
  },
  {
    id: "3",
    name: "Webinar Attendees",
    description: "People who registered for webinars",
    count: 890,
    active: 860,
    unsubscribed: 20,
    bounced: 10,
    updatedAt: "Mar 28, 2026",
  },
  {
    id: "4",
    name: "Product Beta Testers",
    description: "Users in the beta program",
    count: 320,
    active: 310,
    unsubscribed: 5,
    bounced: 5,
    updatedAt: "Mar 15, 2026",
  },
];

export default function RecipientsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recipients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your recipient lists and contacts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New List
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search lists..." className="pl-9" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Contacts</p>
            <p className="text-2xl font-bold">7,030</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">6,670</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Unsubscribed</p>
            <p className="text-2xl font-bold text-yellow-600">240</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Bounced</p>
            <p className="text-2xl font-bold text-red-600">120</p>
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid gap-4 sm:grid-cols-2">
        {recipientLists.map((list) => (
          <Card key={list.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <Link href={`/recipients/${list.id}`} className="group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium group-hover:underline">
                        {list.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {list.description}
                      </p>
                    </div>
                  </div>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm">
                <span>
                  <span className="font-medium">{list.count.toLocaleString()}</span>{" "}
                  total
                </span>
                <Badge variant="secondary" className="text-xs">
                  {list.active.toLocaleString()} active
                </Badge>
                {list.unsubscribed > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {list.unsubscribed} unsub
                  </span>
                )}
                {list.bounced > 0 && (
                  <span className="text-xs text-red-500">
                    {list.bounced} bounced
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Updated {list.updatedAt}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
