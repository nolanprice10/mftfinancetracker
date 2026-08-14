import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

const Privacy = () => (
  <main className="min-h-screen bg-background px-4 py-12">
    <SEO
      title="Privacy Policy"
      description="Learn what MyFinanceTracker stores, why it is used, and how to manage your account data."
      canonicalUrl="/privacy"
    />
    <article className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <Link to="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">Back to MyFinanceTracker</Link>
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: August 14, 2026</p>
      </header>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Information we store</h2>
        <p>MyFinanceTracker stores the account, goal, transaction, investment, and profile information you choose to enter. Authentication is handled by Supabase Auth. We do not store plaintext passwords.</p>
        <h2 className="text-2xl font-semibold">How we use information</h2>
        <p>Your information is used to display your financial dashboard, calculate projections, and provide the recommendations you request. User records are isolated with database Row-Level Security policies.</p>
        <h2 className="text-2xl font-semibold">Sharing and retention</h2>
        <p>We do not sell personal information. Data may be processed by infrastructure providers required to operate the service. You may request account deletion through Settings or by contacting support.</p>
        <h2 className="text-2xl font-semibold">Cookies and analytics</h2>
        <p>Authentication may use browser storage required for a signed-in session. Non-essential analytics scripts are not loaded by default.</p>
        <h2 className="text-2xl font-semibold">Contact</h2>
        <p>Questions or privacy requests can be sent to <a className="underline" href="mailto:nolangp10@icloud.com">nolangp10@icloud.com</a>.</p>
      </section>
    </article>
  </main>
);

export default Privacy;
