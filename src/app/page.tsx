import Link from "next/link";
import {
  Mail,
  Eye,
  Building2,
  Users,
  BarChart3,
  MousePointerClick,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Eye,
    title: "Individual Read Receipts",
    description:
      "Know exactly who opened your email with name and precise timestamp.",
  },
  {
    icon: Building2,
    title: "Organisation Rollup",
    description:
      "See how many people at Tata Corp opened your campaign — and who specifically.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Live dashboard that updates as opens happen. War room feel during big launches.",
  },
  {
    icon: MousePointerClick,
    title: "Click Tracking",
    description:
      "Know who clicked which link and when. HMAC-signed for security.",
  },
  {
    icon: Users,
    title: "Multi-User Workspace",
    description:
      "Your whole team on one account. Owner, Admin, and Member roles.",
  },
  {
    icon: CheckCircle2,
    title: "Engagement Scoring",
    description:
      "Cold, Warm, or Hot — automatically score recipients based on activity.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    features: ["1 team member", "3 campaigns/month", "500 emails/month", "Aggregate open count"],
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">Skcript Mail</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="mb-4 inline-flex items-center rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
          Built for B2B sales &amp; marketing teams
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Mailchimp shows open <span className="text-primary">rates</span>.
          <br />
          We show open <span className="text-primary">names</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Individual-level read receipts with exact timestamps. Organisation-level
          rollup. Know exactly who opened your email, from which company, and when.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="text-base">
              Start for Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg" className="text-base">
              See Features
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">
            Everything you need for B2B email campaigns
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Go beyond aggregate open rates. Get actionable intelligence on every
            recipient.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-card p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold">
            Simple, transparent pricing
          </h2>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 ${
                  plan.popular
                    ? "border-primary shadow-lg ring-1 ring-primary"
                    : "bg-card"
                }`}
              >
                {plan.popular && (
                  <span className="mb-4 inline-block rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-8 block">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Skcript Mail</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Skcript. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
