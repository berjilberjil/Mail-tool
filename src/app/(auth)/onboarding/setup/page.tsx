"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { organization } from "@/lib/auth-client";
import { ensureOrgRecord } from "@/lib/actions/team";

export default function OnboardingSetupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const orgName = formData.get("orgName") as string;
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { error: orgError } = await organization.create({
      name: orgName,
      slug,
    });

    if (orgError) {
      setError(orgError.message || "Failed to create organisation.");
      setLoading(false);
      return;
    }

    // Create extended org record with billing fields
    try {
      await ensureOrgRecord();
    } catch {
      // Non-critical - org record will be created on first dashboard load
    }

    router.push("/dashboard");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Set up your organisation</h1>
        <p className="text-sm text-muted-foreground">
          This is where your team&apos;s campaigns and analytics will live.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="orgName">Organisation name</Label>
          <Input
            id="orgName"
            name="orgName"
            placeholder="e.g., Skcript Technologies"
            required
          />
          <p className="text-xs text-muted-foreground">
            You can change this later in settings.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="orgSize">Team size</Label>
          <select
            id="orgSize"
            name="orgSize"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="1-5">1-5 people</option>
            <option value="6-20">6-20 people</option>
            <option value="21-50">21-50 people</option>
            <option value="51+">51+ people</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Your role</Label>
          <select
            id="role"
            name="role"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
            <option value="founder">Founder / CEO</option>
            <option value="engineering">Engineering</option>
            <option value="other">Other</option>
          </select>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Organisation <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
