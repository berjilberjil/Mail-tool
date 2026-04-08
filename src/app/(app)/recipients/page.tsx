"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Upload, Users, MoreHorizontal, Trash2, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  getRecipientLists,
  getRecipientStats,
  createRecipientList,
  updateRecipientList,
  deleteRecipientList,
} from "@/lib/actions/recipients";

type RecipientList = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  totalCount: number;
  activeCount: number;
  unsubscribedCount: number;
  bouncedCount: number;
};

type Stats = {
  total: number;
  active: number;
  unsubscribed: number;
  bounced: number;
};

export default function RecipientsPage() {
  const [lists, setLists] = useState<RecipientList[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, unsubscribed: 0, bounced: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingList, setEditingList] = useState<RecipientList | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  async function fetchData() {
    try {
      const [listsData, statsData] = await Promise.all([
        getRecipientLists(),
        getRecipientStats(),
      ]);
      setLists(listsData as RecipientList[]);
      setStats(statsData as Stats);
    } catch (err) {
      console.error("Failed to load recipients:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createRecipientList({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      setNewName("");
      setNewDescription("");
      setCreateOpen(false);
      const [listsData, statsData] = await Promise.all([
        getRecipientLists(),
        getRecipientStats(),
      ]);
      setLists(listsData as RecipientList[]);
      setStats(statsData as Stats);
    } catch (err) {
      console.error("Failed to create list:", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit() {
    if (!editingList || !editName.trim()) return;
    setEditSaving(true);
    try {
      await updateRecipientList(editingList.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditingList(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to update list:", err);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(listId: string) {
    if (!confirm("Are you sure you want to delete this list? All recipients in this list will be removed.")) return;
    try {
      await deleteRecipientList(listId);
      await fetchData();
    } catch (err) {
      console.error("Failed to delete list:", err);
    }
  }

  function openEdit(list: RecipientList) {
    setEditingList(list);
    setEditName(list.name);
    setEditDescription(list.description || "");
  }

  function formatDate(date: Date | null) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (list.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="mt-4 h-5 w-48" />
                <Skeleton className="mt-2 h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Recipients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your recipient lists and contacts
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New List
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Recipient List</DialogTitle>
                <DialogDescription>
                  Create a new list to organize your recipients.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="list-name">Name</Label>
                  <Input
                    id="list-name"
                    placeholder="e.g. Enterprise Leads"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="list-description">Description (optional)</Label>
                  <Textarea
                    id="list-description"
                    placeholder="Describe who belongs in this list..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                >
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search lists..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Contacts</p>
            <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Unsubscribed</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.unsubscribed.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Bounced</p>
            <p className="text-2xl font-bold text-red-600">{stats.bounced.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      {filteredLists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Users className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">
              {searchQuery ? "No lists match your search" : "No recipient lists yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? "Try a different search term."
                : "Create your first recipient list to get started."}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New List
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredLists.map((list) => (
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
                          {list.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(list)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(list.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span>
                    <span className="font-medium">{list.totalCount.toLocaleString()}</span>{" "}
                    total
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {list.activeCount.toLocaleString()} active
                  </Badge>
                  {list.unsubscribedCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {list.unsubscribedCount} unsub
                    </span>
                  )}
                  {list.bouncedCount > 0 && (
                    <span className="text-xs text-red-500">
                      {list.bouncedCount} bounced
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Updated {formatDate(list.updatedAt || list.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit List Dialog */}
      <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
            <DialogDescription>Update the list name and description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingList(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={editSaving || !editName.trim()}>
              {editSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
