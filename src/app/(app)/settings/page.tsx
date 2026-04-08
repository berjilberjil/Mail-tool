"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession, organization } from "@/lib/auth-client";
import { deleteOrganisation, getOrgSettings, updateOrgSettings } from "@/lib/actions/team";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadOrg() {
      try {
        const [res, settings] = await Promise.all([
          organization.getFullOrganization(),
          getOrgSettings(),
        ]);
        if (res?.data) {
          setOrgName(res.data.name || "");
          setOrgSlug(res.data.slug || "");
        }
        if (settings) {
          setFromEmail(settings.defaultFromEmail || "");
          setReplyTo(settings.defaultReplyTo || "");
        }
      } catch {
        // Org may not be loaded yet
      } finally {
        setLoading(false);
      }
    }
    if (!sessionPending && session) {
      loadOrg();
    }
  }, [session, sessionPending]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        organization.update({
          data: { name: orgName },
        }),
        updateOrgSettings({
          defaultFromEmail: fromEmail,
          defaultReplyTo: replyTo,
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Update may not be supported depending on permissions
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOrg() {
    const confirmed = prompt(
      `Type "${orgName}" to confirm deletion. This action is irreversible.`
    );
    if (confirmed !== orgName) return;
    setDeleting(true);
    try {
      await deleteOrganisation();
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      alert(message);
    } finally {
      setDeleting(false);
    }
  }

  if (sessionPending || loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Separator />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your organisation settings
        </p>
      </div>

      {/* Org Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Organisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organisation Name</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgSlug">Slug</Label>
              <Input id="orgSlug" value={orgSlug} disabled />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="fromEmail">Default From Email</Label>
            <Input
              id="fromEmail"
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="hello@company.com"
            />
            <p className="text-xs text-muted-foreground">
              Used as the default sender address for campaigns
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="replyTo">Default Reply-To Email</Label>
            <Input
              id="replyTo"
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="support@company.com"
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
            <div>
              <p className="font-medium">Delete Organisation</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this organisation and all its data.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteOrg}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
