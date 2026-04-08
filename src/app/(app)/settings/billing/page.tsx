"use client";

import { useState, useEffect } from "react";
import { CreditCard, Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrgPlan, getCampaignUsage, getTeamMembers, ensureOrgRecord } from "@/lib/actions/team";
import { useSession } from "@/lib/auth-client";

const planLimits: Record<string, { campaigns: number; emails: number; members: number }> = {
  free: { campaigns: 3, emails: 500, members: 1 },
  pro: { campaigns: Infinity, emails: 10000, members: 5 },
  business: { campaigns: Infinity, emails: 100000, members: Infinity },
};

const planDescriptions: Record<string, string> = {
  free: "Basic email campaigns with aggregate tracking",
  pro: "Advanced campaigns with individual tracking and analytics",
  business: "Enterprise-grade campaigns with unlimited access",
};

const plans = [
  {
    name: "Free",
    key: "free",
    price: "\u20B90",
    period: "",
    features: [
      "1 team member",
      "3 campaigns/month",
      "500 emails/month",
      "Aggregate open count only",
    ],
  },
  {
    name: "Pro",
    key: "pro",
    price: "\u20B9999",
    period: "/mo",
    features: [
      "5 team members",
      "Unlimited campaigns",
      "10,000 emails/month",
      "Individual read receipts",
      "Org rollup & click tracking",
      "CSV export",
      "Engagement scoring",
    ],
    popular: true,
  },
  {
    name: "Business",
    key: "business",
    price: "\u20B93,999",
    period: "/mo",
    features: [
      "Unlimited members",
      "100,000 emails/month",
      "Everything in Pro",
      "Custom sending domain",
      "API access",
      "Priority support",
    ],
  },
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BillingSettingsPage() {
  const { data: session } = useSession();
  const [currentPlan, setCurrentPlan] = useState("free");
  const [campaignsUsed, setCampaignsUsed] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    async function loadBillingData() {
      try {
        // Ensure org row exists in organisations table before querying
        await ensureOrgRecord();
        const [orgPlan, usage, members] = await Promise.all([
          getOrgPlan(),
          getCampaignUsage(),
          getTeamMembers(),
        ]);
        setCurrentPlan(orgPlan?.plan || "free");
        setCampaignsUsed(usage?.campaignsThisMonth || 0);
        setMemberCount(members?.length || 0);
      } catch {
        // Fallback to defaults
      } finally {
        setLoading(false);
      }
    }
    loadBillingData();
  }, []);

  const handleUpgrade = async (planKey: string) => {
    if (planKey === "free" || planKey === currentPlan) return;

    setUpgrading(planKey);

    try {
      // Load Razorpay checkout script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load payment gateway. Please try again.");
        setUpgrading(null);
        return;
      }

      // Create order on server
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create order");
        setUpgrading(null);
        return;
      }

      const { orderId, amount, currency } = await res.json();

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount,
        currency,
        name: "Skcript Mail",
        description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan - Monthly`,
        order_id: orderId,
        prefill: {
          name: session?.user?.name || "",
          email: session?.user?.email || "",
        },
        handler: async (response: RazorpayPaymentResponse) => {
          // Verify payment on server
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planKey,
              }),
            });

            if (verifyRes.ok) {
              setCurrentPlan(planKey);
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
          setUpgrading(null);
        },
        theme: { color: "#6366f1" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setUpgrading(null);
      });
      rzp.open();
    } catch {
      alert("Something went wrong. Please try again.");
      setUpgrading(null);
    }
  };

  const limits = planLimits[currentPlan] || planLimits.free;
  const planLabel = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);
  const description = planDescriptions[currentPlan] || planDescriptions.free;

  const campaignPercent =
    limits.campaigns === Infinity
      ? 0
      : Math.min(100, Math.round((campaignsUsed / limits.campaigns) * 100));

  const memberPercent =
    limits.members === Infinity
      ? 0
      : Math.min(100, Math.round((memberCount / limits.members) * 100));

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-28" />
            </div>
            <Separator />
            <div className="space-y-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
        <div>
          <Skeleton className="mb-4 h-6 w-36" />
          <div className="grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="mt-2 h-10 w-24" />
                  <div className="mt-6 space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                  <Skeleton className="mt-6 h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{planLabel} Plan</h3>
                <Badge variant="secondary">Current</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {currentPlan === "free" && (
              <Button onClick={() => handleUpgrade("pro")}>
                Upgrade <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          <Separator />

          {/* Usage */}
          <div className="space-y-4">
            <h4 className="font-medium">Usage This Month</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Campaigns</span>
                  <span className="font-medium">
                    {campaignsUsed} /{" "}
                    {limits.campaigns === Infinity
                      ? "Unlimited"
                      : limits.campaigns}
                  </span>
                </div>
                {limits.campaigns !== Infinity && (
                  <Progress value={campaignPercent} className="mt-1" />
                )}
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Emails Sent</span>
                  <span className="font-medium">
                    {limits.emails === Infinity
                      ? "Unlimited"
                      : `0 / ${limits.emails.toLocaleString()}`}
                  </span>
                </div>
                <Progress value={0} className="mt-1" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Team Members</span>
                  <span className="font-medium">
                    {memberCount} /{" "}
                    {limits.members === Infinity
                      ? "Unlimited"
                      : limits.members}
                  </span>
                </div>
                {limits.members !== Infinity && (
                  <Progress value={memberPercent} className="mt-1" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Available Plans</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.key === currentPlan;
            const isUpgrading = upgrading === plan.key;
            return (
              <Card
                key={plan.name}
                className={
                  plan.popular
                    ? "border-primary ring-1 ring-primary"
                    : isCurrent
                    ? "border-primary/50"
                    : ""
                }
              >
                <CardContent className="p-6">
                  {plan.popular && (
                    <Badge className="mb-3">Most Popular</Badge>
                  )}
                  {isCurrent && (
                    <Badge variant="outline" className="mb-3">
                      Current Plan
                    </Badge>
                  )}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <ul className="mt-6 space-y-2">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={
                      isCurrent
                        ? "outline"
                        : plan.popular
                        ? "default"
                        : "outline"
                    }
                    disabled={isCurrent || plan.key === "free" || isUpgrading}
                    onClick={() => handleUpgrade(plan.key)}
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : (
                      "Upgrade"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
