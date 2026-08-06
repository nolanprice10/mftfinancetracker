import { Helmet } from 'react-helmet-async';
import { DEFAULT_OG_IMAGE, SITE_NAME, buildCanonicalUrl } from '@/lib/site';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, unknown>;
  noIndex?: boolean;
}

export const SEO = ({ 
  title, 
  description, 
  keywords = "investment calculator, compound interest calculator, portfolio tracker, personal finance, wealth management, retirement planning, financial goals, quant finance",
  ogImage = DEFAULT_OG_IMAGE,
  canonicalUrl,
  structuredData,
  noIndex = false,
}: SEOProps) => {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const fullCanonicalUrl = buildCanonicalUrl(canonicalUrl || "/");

  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    applicationCategory: "FinanceApplication",
    description,
    url: fullCanonicalUrl,
    image: ogImage,
    inLanguage: "en",
  };

  const resolvedStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="MyFinanceTracker" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullCanonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(resolvedStructuredData)}
      </script>
    </Helmet>
  );
};
