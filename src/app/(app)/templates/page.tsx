"use client";

import Link from "next/link";
import { Plus, FileText, MoreHorizontal, Copy, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const galleryTemplates = [
  { id: "g1", name: "Product Launch", description: "Clean layout for product announcements", isGallery: true },
  { id: "g2", name: "Newsletter", description: "Multi-section monthly updates", isGallery: true },
  { id: "g3", name: "Event Invite", description: "CTA-focused for webinars & events", isGallery: true },
  { id: "g4", name: "Welcome Email", description: "Onboarding for new users", isGallery: true },
  { id: "g5", name: "Plain Text", description: "Simple text-based email", isGallery: true },
];

const myTemplates = [
  { id: "t1", name: "Q2 Launch Template", description: "Custom template for Q2 product launch", updatedAt: "Apr 3, 2026" },
  { id: "t2", name: "Weekly Digest", description: "Weekly update email for subscribers", updatedAt: "Mar 28, 2026" },
  { id: "t3", name: "Sales Outreach v2", description: "Personal outreach template for sales team", updatedAt: "Mar 20, 2026" },
];

export default function TemplatesPage() {
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
        <Link href="/templates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Template
          </Button>
        </Link>
      </div>

      {/* Gallery */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Template Gallery</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {galleryTemplates.map((t) => (
            <Card key={t.id} className="group relative overflow-hidden">
              <CardContent className="p-4">
                <div className="mb-3 flex h-40 items-center justify-center rounded-md bg-muted">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="font-medium">{t.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.description}
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
              <Link href="/templates/new" className="mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Template
                </Button>
              </Link>
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
                        {t.description}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Updated {t.updatedAt}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
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
