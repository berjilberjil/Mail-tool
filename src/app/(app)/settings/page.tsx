"use client";

import { Building2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
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
              <Input id="orgName" defaultValue="Skcript Technologies" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgSlug">Slug</Label>
              <Input id="orgSlug" defaultValue="skcript" disabled />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="fromEmail">Default From Email</Label>
            <Input
              id="fromEmail"
              type="email"
              defaultValue="hello@skcript.com"
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
              defaultValue="support@skcript.com"
            />
          </div>

          <Button>
            <Save className="mr-2 h-4 w-4" /> Save Changes
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
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
