"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, MoreHorizontal, Copy, Trash2, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  getTemplates,
  getGalleryTemplates,
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  seedGalleryTemplates,
} from "@/lib/actions/templates";

type Template = {
  id: string;
  orgId: string;
  createdBy: string;
  name: string;
  subject: string;
  contentJson: unknown;
  contentHtml: string | null;
  isGallery: boolean;
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function TemplatesPage() {
  const [galleryTemplates, setGalleryTemplates] = useState<Template[]>([]);
  const [myTemplates, setMyTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSubject, setNewSubject] = useState("");

  async function fetchData() {
    try {
      await seedGalleryTemplates();
      const [gallery, custom] = await Promise.all([
        getGalleryTemplates(),
        getTemplates(),
      ]);
      setGalleryTemplates(gallery as Template[]);
      setMyTemplates(custom as Template[]);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleCreate() {
    if (!newName.trim() || !newSubject.trim()) return;
    setCreating(true);
    try {
      await createTemplate({ name: newName.trim(), subject: newSubject.trim() });
      setNewName("");
      setNewSubject("");
      setCreateOpen(false);
      const custom = await getTemplates();
      setMyTemplates(custom as Template[]);
    } catch (err) {
      console.error("Failed to create template:", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await duplicateTemplate(id);
      const custom = await getTemplates();
      setMyTemplates(custom as Template[]);
    } catch (err) {
      console.error("Failed to duplicate template:", err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTemplate(id);
      const custom = await getTemplates();
      setMyTemplates(custom as Template[]);
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div>
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="mb-3 h-40 w-full rounded-md" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="mt-2 h-3 w-full" />
                  <Skeleton className="mt-3 h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="mb-3 h-40 w-full rounded-md" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-2 h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Pre-built and custom email templates for your campaigns
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Template
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>
                Create a new email template. You can edit the content later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g. Monthly Newsletter"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-subject">Subject Line</Label>
                <Input
                  id="template-subject"
                  placeholder="e.g. Your monthly update from {{company}}"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                onClick={handleCreate}
                disabled={creating || !newName.trim() || !newSubject.trim()}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gallery */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Template Gallery</h2>
        {galleryTemplates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No gallery templates available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {galleryTemplates.map((t) => (
              <Card key={t.id} className="group relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="mb-3 flex h-40 items-center justify-center rounded-md bg-muted">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="font-medium">{t.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.subject}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Gallery
                  </Badge>
                  <div className="mt-3">
                    <Link href={`/templates/new?from=${t.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Use Template
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* My Templates */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">My Templates</h2>
        {myTemplates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No custom templates yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first template or customize one from the gallery.
              </p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myTemplates.map((t) => (
              <Card key={t.id} className="group relative">
                <CardContent className="p-4">
                  <div className="mb-3 flex h-40 items-center justify-center rounded-md bg-muted">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.subject}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Updated {formatDate(t.updatedAt)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/templates/${t.id}/edit`}>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem onClick={() => handleDuplicate(t.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
