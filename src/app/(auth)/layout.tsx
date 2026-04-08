import { Mail } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left - branding panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20">
            <Mail className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold">Skcript Mail</span>
        </div>
        <div>
          <blockquote className="text-2xl font-medium leading-relaxed">
            &ldquo;We went from guessing who read our emails to knowing exactly
            who opened, when, and from which company.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm opacity-80">
            — Campaign Manager, B2B SaaS Company
          </p>
        </div>
        <p className="text-xs opacity-60">
          &copy; {new Date().getFullYear()} Skcript. All rights reserved.
        </p>
      </div>

      {/* Right - form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
