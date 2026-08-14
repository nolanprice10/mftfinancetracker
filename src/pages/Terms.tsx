import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

const Terms = () => (
  <main className="min-h-screen bg-background px-4 py-12">
    <SEO
      title="Terms of Service"
      description="Review the terms for using MyFinanceTracker and its personal finance planning tools."
      canonicalUrl="/terms"
    />
    <article className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <Link to="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">Back to MyFinanceTracker</Link>
        <h1 className="text-4xl font-bold">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: August 14, 2026</p>
      </header>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Using the service</h2>
        <p>MyFinanceTracker provides personal planning and tracking tools. You are responsible for the accuracy of information entered into your account and for protecting access to your account.</p>
        <h2 className="text-2xl font-semibold">Not financial advice</h2>
        <p>Calculations, projections, and recommendations are educational tools, not financial, investment, tax, or legal advice. Review important decisions with a qualified professional.</p>
        <h2 className="text-2xl font-semibold">Acceptable use</h2>
        <p>Do not abuse the service, attempt to access another user’s data, probe its infrastructure, or submit unlawful content. We may suspend access when necessary to protect users or the service.</p>
        <h2 className="text-2xl font-semibold">Account cancellation</h2>
        <p>You may stop using the service or request deletion of your account through Settings. Some records may be retained where required for security, legal, or operational purposes.</p>
        <h2 className="text-2xl font-semibold">Contact</h2>
        <p>Questions about these terms can be sent to <a className="underline" href="mailto:nolangp10@icloud.com">nolangp10@icloud.com</a>.</p>
      </section>
    </article>
  </main>
);

export default Terms;
