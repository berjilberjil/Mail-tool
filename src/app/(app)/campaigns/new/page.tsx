"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Calendar,
  Send,
  FileText,
  Users,
  Settings2,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getTemplates, getGalleryTemplates, seedGalleryTemplates } from "@/lib/actions/templates";
import { getRecipientLists } from "@/lib/actions/recipients";
import { createCampaign, sendCampaign } from "@/lib/actions/campaigns";

const steps = [
  { id: 1, label: "Template", icon: FileText },
  { id: 2, label: "Recipients", icon: Users },
  { id: 3, label: "Settings", icon: Settings2 },
  { id: 4, label: "Review & Send", icon: Send },
];

type Template = {
  id: string;
  name: string;
  subject: string;
  contentHtml: string | null;
  contentJson: unknown;
};

type RecipientList = {
  id: string;
  name: string;
  description: string | null;
  totalCount: number;
  activeCount: number;
};

export default function NewCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Template state
  const [galleryTemplates, setGalleryTemplates] = useState<Template[]>([]);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Recipients state
  const [recipientLists, setRecipientLists] = useState<RecipientList[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [pasteEmails, setPasteEmails] = useState("");

  // Settings state
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    async function load() {
      try {
        await seedGalleryTemplates();
        const [gallery, custom, lists] = await Promise.all([
          getGalleryTemplates(),
          getTemplates(),
          getRecipientLists(),
        ]);
        setGalleryTemplates(gallery as Template[]);
        setCustomTemplates(custom as Template[]);
        setRecipientLists(lists as RecipientList[]);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const allTemplates = [...galleryTemplates, ...customTemplates];
  const selectedTemplate = allTemplates.find((t) => t.id === selectedTemplateId);

  const totalRecipients = selectedListIds.reduce((sum, id) => {
    const list = recipientLists.find((l) => l.id === id);
    return sum + (list?.activeCount || 0);
  }, 0);

  const toggleList = (id: string) => {
    setSelectedListIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!selectedTemplateId || selectedListIds.length === 0 || !campaignName || !subject || !fromName || !fromEmail) {
      alert("Please fill in all required fields.");
      return;
    }

    setSending(true);
    try {
      const campaign = await createCampaign({
        name: campaignName,
        subject,
        previewText: previewText || undefined,
        templateId: selectedTemplateId,
        contentHtml: selectedTemplate?.contentHtml || undefined,
        contentJson: selectedTemplate?.contentJson || undefined,
        fromName,
        fromEmail,
        replyTo: replyTo || undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        recipientListIds: selectedListIds,
      });

      // Send immediately
      await sendCampaign(campaign.id);
      router.push(`/campaigns/${campaign.id}`);
    } catch (err) {
      console.error("Failed to send campaign:", err);
      alert("Failed to send campaign. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!campaignName || !subject || !fromName || !fromEmail) {
      alert("Please fill in campaign name, subject, from name, and from email.");
      return;
    }

    setSending(true);
    try {
      const campaign = await createCampaign({
        name: campaignName,
        subject,
        previewText: previewText || undefined,
        templateId: selectedTemplateId || undefined,
        contentHtml: selectedTemplate?.contentHtml || undefined,
        contentJson: selectedTemplate?.contentJson || undefined,
        fromName,
        fromEmail,
        replyTo: replyTo || undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        recipientListIds: selectedListIds,
      });

      router.push(`/campaigns/${campaign.id}`);
    } catch (err) {
      console.error("Failed to save draft:", err);
      alert("Failed to save draft.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Campaign</h1>
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center shrink-0">
            <button
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 sm:px-4 text-sm font-medium transition-colors ${
                currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : currentStep > step.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {currentStep > step.id ? (
                <Check className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className="mx-1 h-px w-4 bg-border sm:mx-2 sm:w-16" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Template */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choose a Template</CardTitle>
            </CardHeader>
            <CardContent>
              {allTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">No templates available</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create a template first in the Templates section.
                  </p>
                  <Link href="/templates">
                    <Button variant="outline" className="mt-4">
                      Go to Templates
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {allTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTemplateId(t.id);
                        if (!subject && t.subject) setSubject(t.subject);
                      }}
                      className={`rounded-lg border p-4 text-left transition-colors hover:border-primary ${
                        selectedTemplateId === t.id
                          ? "border-primary ring-2 ring-primary/20"
                          : ""
                      }`}
                    >
                      <div className="mb-3 flex h-32 items-center justify-center rounded-md bg-muted">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="font-medium">{t.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.subject || "No subject set"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Recipients */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Recipients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Select existing lists */}
              <div className="space-y-2">
                <Label>Select recipient lists</Label>
                {recipientLists.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8">
                    <Users className="mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="font-medium">No recipient lists yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create a recipient list first.
                    </p>
                    <Link href="/recipients">
                      <Button variant="outline" className="mt-4">
                        Go to Recipients
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {recipientLists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => toggleList(list.id)}
                        className={`rounded-lg border p-3 text-left hover:border-primary ${
                          selectedListIds.includes(list.id)
                            ? "border-primary ring-2 ring-primary/20"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{list.name}</p>
                          {selectedListIds.includes(list.id) && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {list.activeCount.toLocaleString()} active recipients
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Recipients Preview</p>
                  <Badge variant="secondary">
                    {totalRecipients.toLocaleString()} recipients
                  </Badge>
                </div>
                {selectedListIds.length > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Selected {selectedListIds.length} list{selectedListIds.length > 1 ? "s" : ""}:{" "}
                    {selectedListIds
                      .map((id) => recipientLists.find((l) => l.id === id)?.name)
                      .join(", ")}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Select one or more lists above
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Settings */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Campaign Name *</Label>
                  <Input
                    id="campaignName"
                    placeholder="e.g., Q2 Product Launch"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Introducing our new feature"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previewText">Preview Text</Label>
                  <Input
                    id="previewText"
                    placeholder="Text shown in inbox preview"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name *</Label>
                  <Input
                    id="fromName"
                    placeholder="e.g., Varun from Skcript"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email *</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    placeholder="hello@skcript.com"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replyTo">Reply-To Email</Label>
                  <Input
                    id="replyTo"
                    type="email"
                    placeholder="support@skcript.com"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  placeholder="Add tags (comma separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Review & Send */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review & Send</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-medium">Campaign Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span>{campaignName || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subject</span>
                      <span>{subject || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">From</span>
                      <span>{fromName || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Template</span>
                      <span>{selectedTemplate?.name || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recipients</span>
                      <span>{totalRecipients.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-medium">Tracking</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Open tracking</span>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Click tracking</span>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Unsubscribe link</span>
                      <Badge variant="secondary">Included</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <Button className="flex-1" onClick={handleSend} disabled={sending}>
                  {sending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {sending ? "Sending..." : "Send Now"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSaveDraft}
                  disabled={sending}
                >
                  <Calendar className="mr-2 h-4 w-4" /> Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button
          onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
          disabled={currentStep === 4}
        >
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
