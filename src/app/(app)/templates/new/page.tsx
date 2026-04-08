"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  Monitor,
  Smartphone,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image,
  Link2,
  Minus,
  Type,
  Heading1,
  Heading2,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const toolbarButtons = [
  { icon: Undo, label: "Undo" },
  { icon: Redo, label: "Redo" },
  "sep",
  { icon: Heading1, label: "Heading 1" },
  { icon: Heading2, label: "Heading 2" },
  { icon: Type, label: "Paragraph" },
  "sep",
  { icon: Bold, label: "Bold" },
  { icon: Italic, label: "Italic" },
  { icon: Underline, label: "Underline" },
  "sep",
  { icon: AlignLeft, label: "Align Left" },
  { icon: AlignCenter, label: "Align Center" },
  { icon: AlignRight, label: "Align Right" },
  "sep",
  { icon: List, label: "Bullet List" },
  { icon: ListOrdered, label: "Ordered List" },
  "sep",
  { icon: Link2, label: "Link" },
  { icon: Image, label: "Image" },
  { icon: Minus, label: "Divider" },
] as const;

export default function NewTemplatePage() {
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Template Editor</h1>
            <p className="text-sm text-muted-foreground">
              Design your email template
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" /> Preview
          </Button>
          <Button>
            <Save className="mr-2 h-4 w-4" /> Save Template
          </Button>
        </div>
      </div>

      {/* Template name + subject */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input id="templateName" placeholder="e.g., Q2 Launch Template" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Default Subject Line</Label>
              <Input
                id="subject"
                placeholder="e.g., Exciting news from Skcript"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor area */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <Card className="flex flex-col">
          <div className="border-b p-2">
            <div className="flex flex-wrap items-center gap-1">
              {toolbarButtons.map((btn, i) =>
                btn === "sep" ? (
                  <Separator key={i} orientation="vertical" className="mx-1 h-6" />
                ) : (
                  <Button
                    key={i}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title={btn.label}
                  >
                    <btn.icon className="h-4 w-4" />
                  </Button>
                )
              )}
            </div>
          </div>
          <CardContent className="flex-1 p-6">
            {/* TipTap editor placeholder */}
            <div className="min-h-[400px] space-y-4">
              <div
                contentEditable
                suppressContentEditableWarning
                className="min-h-[400px] outline-none"
              >
                <h1 className="text-2xl font-bold">Your Email Heading</h1>
                <p className="mt-4 text-muted-foreground">
                  Start writing your email content here. This is where the
                  TipTap block editor will be integrated. You can add headings,
                  text, images, buttons, and dividers.
                </p>
                <p className="mt-4 text-muted-foreground">
                  Use the toolbar above to format your content. The editor
                  supports rich text formatting, links, images, and more.
                </p>
                <div className="mt-6 inline-block rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
                  Call to Action
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between border-b p-3">
            <p className="text-sm font-medium">Preview</p>
            <Tabs
              value={previewMode}
              onValueChange={(v) =>
                setPreviewMode(v as "desktop" | "mobile")
              }
            >
              <TabsList className="h-8">
                <TabsTrigger value="desktop" className="h-6 px-2">
                  <Monitor className="mr-1 h-3 w-3" /> Desktop
                </TabsTrigger>
                <TabsTrigger value="mobile" className="h-6 px-2">
                  <Smartphone className="mr-1 h-3 w-3" /> Mobile
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CardContent className="flex flex-1 items-start justify-center overflow-auto bg-muted/50 p-6">
            <div
              className={`rounded-lg border bg-white p-8 shadow-sm dark:bg-card ${
                previewMode === "mobile" ? "w-[375px]" : "w-full max-w-[600px]"
              }`}
            >
              <h1 className="text-2xl font-bold text-foreground">
                Your Email Heading
              </h1>
              <p className="mt-4 text-sm text-muted-foreground">
                Start writing your email content here. This is where the TipTap
                block editor will be integrated. You can add headings, text,
                images, buttons, and dividers.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Use the toolbar above to format your content. The editor supports
                rich text formatting, links, images, and more.
              </p>
              <div className="mt-6">
                <span className="inline-block rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
                  Call to Action
                </span>
              </div>
              <div className="mt-8 border-t pt-4 text-xs text-muted-foreground">
                <p>Skcript Technologies</p>
                <p className="mt-1">
                  <a href="#" className="underline">
                    Unsubscribe
                  </a>{" "}
                  from these emails
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
