import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export const SEO = ({ 
  title, 
  description, 
  keywords = "investment calculator, compound interest calculator, portfolio tracker, personal finance, wealth management, retirement planning, financial goals, quant finance",
  ogImage = "https://storage.googleapis.com/gpt-engineer-file-uploads/d5ueX6bSSFP88pUlY4aTBJeKlXo1/social-images/social-1762136875706-IMG_1359.jpeg",
  canonicalUrl
}: SEOProps) => {
  const fullTitle = `${title} | MyFinanceTracker`;
  const siteUrl = "https://myfinancetracker.app";
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
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
    </Helmet>
  );
};
