"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Crown,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getTeamMembers,
  getPendingInvitations,
  inviteTeamMember,
  changeTeamMemberRole,
  removeTeamMember,
  revokeInvitation,
} from "@/lib/actions/team";
import { format } from "date-fns";

type TeamMember = {
  memberId: string;
  role: string;
  joinedAt: Date | null;
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
};

type PendingInvitation = {
  id: string;
  email: string;
  role: string | null;
  status: string;
};

const roleIcons: Record<string, typeof Shield> = {
  owner: Crown,
  admin: ShieldCheck,
  member: Shield,
};

const roleColors: Record<string, string> = {
  owner: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  member: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      try {
        const [membersData, invitesData] = await Promise.all([
          getTeamMembers(),
          getPendingInvitations(),
        ]);
        setMembers(membersData as TeamMember[]);
        setPendingInvites(invitesData as PendingInvitation[]);
      } catch (err) {
        setError("Failed to load team data.");
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, []);

  async function refreshData() {
    const [membersData, invitesData] = await Promise.all([
      getTeamMembers(),
      getPendingInvitations(),
    ]);
    setMembers(membersData as TeamMember[]);
    setPendingInvites(invitesData as PendingInvitation[]);
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteTeamMember(inviteEmail.trim(), inviteRole);
      setInviteEmail("");
      setInviteRole("member");
      setInviteOpen(false);
      await refreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to invite";
      alert(message);
    } finally {
      setInviting(false);
    }
  }

  async function handleChangeRole(memberId: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "member" : "admin";
    try {
      await changeTeamMemberRole(memberId, newRole);
      await refreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change role";
      alert(message);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await removeTeamMember(memberId);
      await refreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove member";
      alert(message);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    try {
      await revokeInvitation(inviteId);
      await refreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to revoke";
      alert(message);
    }
  }

  async function handleResendInvite(email: string, role: string) {
    try {
      await inviteTeamMember(email, role || "member");
      await refreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend";
      alert(message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-9 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team Members</CardTitle>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer">
              <UserPlus className="mr-2 h-4 w-4" /> Invite Member
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invite email to add a new member to your organisation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email address</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Role</Label>
                  <select
                    id="inviteRole"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                  {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No team members found. Invite someone to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const role = member.role || "member";
                const RoleIcon = roleIcons[role] || Shield;
                const initials = member.userName
                  ? getInitials(member.userName)
                  : "??";
                const joinedFormatted = member.joinedAt
                  ? format(new Date(member.joinedAt), "MMM yyyy")
                  : "";

                return (
                  <div
                    key={member.memberId}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.userName || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.userEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          roleColors[role] || roleColors.member
                        }`}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {role}
                      </span>
                      {joinedFormatted && (
                        <span className="text-xs text-muted-foreground">
                          Joined {joinedFormatted}
                        </span>
                      )}
                      {role !== "owner" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleChangeRole(member.memberId, role)}>
                              Switch to {role === "admin" ? "Member" : "Admin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemove(member.memberId)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {invite.role || "member"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Pending</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResendInvite(invite.email, invite.role || "member")}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleRevokeInvite(invite.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
