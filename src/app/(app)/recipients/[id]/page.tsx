"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Download,
  Plus,
  Building2,
  Filter,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  getRecipientList,
  getRecipients,
  addRecipient,
  addRecipientsFromCSV,
  deleteRecipient,
} from "@/lib/actions/recipients";

type RecipientList = {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Recipient = {
  id: string;
  orgId: string;
  listId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  metadata: unknown;
  status: string;
  engagementScore: number;
  createdAt: Date;
  updatedAt: Date;
};

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

function getEngagementLabel(score: number): string {
  if (score >= 5) return "hot";
  if (score >= 1) return "warm";
  return "cold";
}

export default function RecipientListDetailPage() {
  const params = useParams();
  const listId = params.id as string;

  const [list, setList] = useState<RecipientList | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Add recipient dialog
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [addError, setAddError] = useState("");

  // CSV import dialog
  const [csvOpen, setCsvOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [csvText, setCsvText] = useState("");

  const fetchingRef = React.useRef(false);

  const fetchRecipients = useCallback(async (search?: string, status?: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const filters: { status?: string; search?: string } = {};
      if (status) filters.status = status;
      if (search) filters.search = search;
      const data = await getRecipients(listId, Object.keys(filters).length > 0 ? filters : undefined);
      setRecipients(data as Recipient[]);
    } catch (err) {
      console.error("Failed to load recipients:", err);
    } finally {
      fetchingRef.current = false;
    }
  }, [listId]);

  // Initial load: fetch list metadata + recipients once
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [listData, recipientsData] = await Promise.all([
          getRecipientList(listId),
          getRecipients(listId),
        ]);
        if (!cancelled) {
          setList(listData as RecipientList | null);
          setRecipients(recipientsData as Recipient[]);
        }
      } catch (err) {
        console.error("Failed to load list data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [listId]);

  // Debounced search and status filter (skip initial render)
  const initialLoadDone = React.useRef(false);
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      return;
    }
    const timer = setTimeout(() => {
      fetchRecipients(searchQuery || undefined, statusFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, fetchRecipients]);

  async function handleAddRecipient() {
    if (!newEmail.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const result = await addRecipient({
        listId,
        email: newEmail.trim(),
        firstName: newFirstName.trim() || undefined,
        lastName: newLastName.trim() || undefined,
        company: newCompany.trim() || undefined,
      });
      if (!result.success) {
        setAddError(result.error || "Failed to add recipient.");
        setAdding(false);
        return;
      }
      setNewEmail("");
      setNewFirstName("");
      setNewLastName("");
      setNewCompany("");
      setAddError("");
      setAddOpen(false);
      // Clear search/filter so the new recipient is visible
      setSearchQuery("");
      setStatusFilter(undefined);
      await fetchRecipients(undefined, undefined);
    } catch (err) {
      console.error("Failed to add recipient:", err);
      setAddError("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  function parseCSV(text: string): Array<{ email: string; firstName?: string; lastName?: string; company?: string }> {
    const lines = text.trim().split("\n");
    if (lines.length === 0) return [];

    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes("email") || firstLine.includes("first") || firstLine.includes("last");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
        if (!parts[0] || !parts[0].includes("@")) return null;
        return {
          email: parts[0],
          firstName: parts[1] || undefined,
          lastName: parts[2] || undefined,
          company: parts[3] || undefined,
        };
      })
      .filter(Boolean) as Array<{ email: string; firstName?: string; lastName?: string; company?: string }>;
  }

  async function handleCSVImport() {
    if (!csvText.trim()) return;
    setImporting(true);
    try {
      const rows = parseCSV(csvText);
      if (rows.length === 0) {
        alert("No valid rows found in CSV. Each row needs at least an email address.");
        setImporting(false);
        return;
      }
      await addRecipientsFromCSV(listId, rows);
      setCsvText("");
      setCsvOpen(false);
      setSearchQuery("");
      setStatusFilter(undefined);
      await fetchRecipients(undefined, undefined);
    } catch (err) {
      console.error("Failed to import CSV:", err);
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRecipient(id);
      await fetchRecipients(searchQuery || undefined, statusFilter);
    } catch (err) {
      console.error("Failed to delete recipient:", err);
    }
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function cycleStatusFilter() {
    const statuses = [undefined, "active", "unsubscribed", "bounced"];
    const currentIndex = statuses.indexOf(statusFilter);
    const nextIndex = (currentIndex + 1) % statuses.length;
    setStatusFilter(statuses[nextIndex]);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/recipients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">List not found</h1>
            <p className="text-sm text-muted-foreground">
              This recipient list does not exist or you do not have access to it.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">{list.name}</h1>
            <p className="text-sm text-muted-foreground">
              {recipients.length.toLocaleString()} recipients · Updated {formatDate(list.updatedAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" /> Import CSV
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Recipients from CSV</DialogTitle>
                <DialogDescription>
                  Paste your CSV data below. Expected format: email, firstName, lastName, company (one per line). A header row is optional.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="csv-data">CSV Data</Label>
                <Textarea
                  id="csv-data"
                  placeholder={`email,firstName,lastName,company\njohn@example.com,John,Doe,Acme Inc\njane@example.com,Jane,Smith,Widget Co`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="min-h-[160px] font-mono text-xs"
                />
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button
                  onClick={handleCSVImport}
                  disabled={importing || !csvText.trim()}
                >
                  {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Recipients
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Recipient</DialogTitle>
                <DialogDescription>
                  Add a new recipient to this list.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {addError && (
                  <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {addError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="recipient-email">Email *</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    placeholder="john@example.com"
                    value={newEmail}
                    onChange={(e) => { setNewEmail(e.target.value); setAddError(""); }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient-first">First Name</Label>
                    <Input
                      id="recipient-first"
                      placeholder="John"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipient-last">Last Name</Label>
                    <Input
                      id="recipient-last"
                      placeholder="Doe"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient-company">Company</Label>
                  <Input
                    id="recipient-company"
                    placeholder="Acme Inc"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button
                  onClick={handleAddRecipient}
                  disabled={adding || !newEmail.trim()}
                >
                  {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant={statusFilter ? "default" : "outline"}
          size="sm"
          onClick={cycleStatusFilter}
        >
          <Filter className="mr-2 h-4 w-4" />
          {statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : "Status"}
        </Button>
        {statusFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter(undefined)}
          >
            Clear filter
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {recipients.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Building2 className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">
                {searchQuery || statusFilter ? "No recipients match your filters" : "No recipients yet"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || statusFilter
                  ? "Try adjusting your search or filters."
                  : "Add recipients manually or import a CSV file."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((r) => {
                  const engagement = getEngagementLabel(r.engagementScore);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.firstName || r.lastName
                          ? `${r.firstName || ""} ${r.lastName || ""}`.trim()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.email}
                      </TableCell>
                      <TableCell>
                        {r.company ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {r.company}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[r.status] || "outline"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            engagementColor[engagement]
                          }`}
                        >
                          {engagement}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {r.engagementScore}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
