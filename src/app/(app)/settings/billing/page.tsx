"use client";

import { CreditCard, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    features: [
      "1 team member",
      "3 campaigns/month",
      "500 emails/month",
      "Aggregate open count only",
    ],
    current: true,
  },
  {
    name: "Pro",
    price: "$12",
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
    price: "$49",
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

export default function BillingSettingsPage() {
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
                <h3 className="text-xl font-bold">Free Plan</h3>
                <Badge variant="secondary">Current</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Basic email campaigns with aggregate tracking
              </p>
            </div>
            <Button>
              Upgrade <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Usage */}
          <div className="space-y-4">
            <h4 className="font-medium">Usage This Month</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Campaigns</span>
                  <span className="font-medium">2 / 3</span>
                </div>
                <Progress value={67} className="mt-1" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Emails Sent</span>
                  <span className="font-medium">340 / 500</span>
                </div>
                <Progress value={68} className="mt-1" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Team Members</span>
                  <span className="font-medium">1 / 1</span>
                </div>
                <Progress value={100} className="mt-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Available Plans</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.popular
                  ? "border-primary ring-1 ring-primary"
                  : plan.current
                  ? "border-primary/50"
                  : ""
              }
            >
              <CardContent className="p-6">
                {plan.popular && (
                  <Badge className="mb-3">Most Popular</Badge>
                )}
                {plan.current && (
                  <Badge variant="outline" className="mb-3">
                    Current Plan
                  </Badge>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <ul className="mt-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={plan.current ? "outline" : plan.popular ? "default" : "outline"}
                  disabled={plan.current}
                >
                  {plan.current ? "Current Plan" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
