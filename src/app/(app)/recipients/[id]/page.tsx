"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Download,
  Plus,
  Building2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const recipients = [
  { email: "priya@infosys.com", firstName: "Priya", lastName: "Sharma", company: "Infosys", status: "active", engagement: "hot", score: 8 },
  { email: "rahul@tata.com", firstName: "Rahul", lastName: "Mehta", company: "Tata", status: "active", engagement: "hot", score: 6 },
  { email: "ananya@zoho.com", firstName: "Ananya", lastName: "Rao", company: "Zoho", status: "active", engagement: "warm", score: 3 },
  { email: "karthik@freshworks.com", firstName: "Karthik", lastName: "Nair", company: "Freshworks", status: "active", engagement: "warm", score: 2 },
  { email: "deepa@hcl.com", firstName: "Deepa", lastName: "Iyer", company: "HCL", status: "active", engagement: "cold", score: 0 },
  { email: "vikram@wipro.com", firstName: "Vikram", lastName: "Singh", company: "Wipro", status: "unsubscribed", engagement: "cold", score: 0 },
  { email: "meera@infosys.com", firstName: "Meera", lastName: "Pillai", company: "Infosys", status: "active", engagement: "warm", score: 3 },
  { email: "amit@tata.com", firstName: "Amit", lastName: "Patel", company: "Tata", status: "bounced", engagement: "cold", score: 0 },
  { email: "nisha@zoho.com", firstName: "Nisha", lastName: "Gupta", company: "Zoho", status: "active", engagement: "hot", score: 5 },
  { email: "suresh@hcl.com", firstName: "Suresh", lastName: "Kumar", company: "HCL", status: "active", engagement: "warm", score: 2 },
];

const engagementColor: Record<string, string> = {
  hot: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  warm: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  cold: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  unsubscribed: "secondary",
  bounced: "destructive",
};

export default function RecipientListDetailPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/recipients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Enterprise Leads</h1>
            <p className="text-sm text-muted-foreground">
              1,240 recipients · Updated Apr 5, 2026
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Recipients
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, email, or company..." className="pl-9" />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" /> Status
        </Button>
        <Button variant="outline" size="sm">
          <Building2 className="mr-2 h-4 w-4" /> Company
        </Button>
        <Button variant="outline" size="sm">
          Engagement
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead className="text-center">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((r) => (
                <TableRow key={r.email}>
                  <TableCell className="font-medium">
                    {r.firstName} {r.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      {r.company}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
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
                  <TableCell className="text-center font-medium">
                    {r.score}
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
