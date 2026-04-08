"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const steps = [
  { id: 1, label: "Template", icon: FileText },
  { id: 2, label: "Recipients", icon: Users },
  { id: 3, label: "Settings", icon: Settings2 },
  { id: 4, label: "Review & Send", icon: Send },
];

const templates = [
  { id: "1", name: "Product Launch", description: "Clean, modern layout for product announcements" },
  { id: "2", name: "Newsletter", description: "Multi-section layout for monthly updates" },
  { id: "3", name: "Event Invite", description: "CTA-focused layout for webinars & events" },
  { id: "4", name: "Welcome Email", description: "Onboarding email for new users" },
  { id: "5", name: "Plain Text", description: "Simple text-based email, no frills" },
];

export default function NewCampaignPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
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
              <div className="mx-2 h-px w-8 bg-border sm:w-16" />
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`rounded-lg border p-4 text-left transition-colors hover:border-primary ${
                      selectedTemplate === t.id
                        ? "border-primary ring-2 ring-primary/20"
                        : ""
                    }`}
                  >
                    <div className="mb-3 flex h-32 items-center justify-center rounded-md bg-muted">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium">{t.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Recipients */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Recipients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CSV Upload */}
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8">
                <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Upload CSV file</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  CSV must contain an &ldquo;email&rdquo; column. Optional: first_name,
                  last_name, company.
                </p>
                <Button variant="outline" className="mt-4">
                  Choose File
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>

              {/* Manual paste */}
              <div className="space-y-2">
                <Label>Paste email addresses</Label>
                <Textarea
                  placeholder="john@company.com&#10;priya@infosys.com&#10;rahul@tata.com"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  One email per line. Organisation will be auto-detected from
                  the domain.
                </p>
              </div>

              {/* Or select existing list */}
              <div className="space-y-2">
                <Label>Or select an existing list</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {["Enterprise Leads", "Newsletter Subscribers"].map(
                    (list) => (
                      <button
                        key={list}
                        className="rounded-lg border p-3 text-left hover:border-primary"
                      >
                        <p className="font-medium">{list}</p>
                        <p className="text-xs text-muted-foreground">
                          {list === "Enterprise Leads" ? "1,240" : "4,580"}{" "}
                          recipients
                        </p>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Recipients Preview</p>
                  <Badge variant="secondary">0 recipients</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Upload a CSV or paste emails to see a preview
                </p>
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
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    placeholder="e.g., Q2 Product Launch"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Introducing our new feature"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previewText">Preview Text</Label>
                  <Input
                    id="previewText"
                    placeholder="Text shown in inbox preview"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input id="fromName" placeholder="e.g., Varun from Skcript" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    placeholder="hello@skcript.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replyTo">Reply-To Email</Label>
                  <Input
                    id="replyTo"
                    type="email"
                    placeholder="support@skcript.com"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input placeholder="Add tags (comma separated)" />
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
                      <span>Q2 Product Launch</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subject</span>
                      <span>Introducing our new feature</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">From</span>
                      <span>Varun from Skcript</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recipients</span>
                      <span>2,400</span>
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
                <Button className="flex-1">
                  <Send className="mr-2 h-4 w-4" /> Send Now
                </Button>
                <Button variant="outline" className="flex-1">
                  <Calendar className="mr-2 h-4 w-4" /> Schedule
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
