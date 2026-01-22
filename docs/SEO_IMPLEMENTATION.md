# SPLITDO SEO Implementation Guide

## ✅ What Has Been Implemented

This document outlines the comprehensive SEO implementation for the SPLITDO platform, a Solana-based token presale for a blockchain-powered bill-splitting application.

---

## 🎯 SEO Strategy Overview

### Target Audiences
1. **Crypto/DeFi Investors** - People interested in Solana token presales
2. **Practical Users** - People looking for bill-splitting and expense management solutions

### Primary Keywords
- **Crypto-focused**: Solana token presale, SPLITDO token, crypto bill splitting, blockchain expense sharing, DeFi payments
- **Utility-focused**: bill splitting app, expense sharing, split bills with crypto, group expense management
- **Long-tail**: how to split bills with cryptocurrency, Solana presale 2025, blockchain expense tracker

---

## 📋 Implementation Checklist

### ✅ Core SEO Infrastructure

#### 1. **Layout.astro - Flexible SEO System**
**Location**: `src/layouts/Layout.astro`

**Features Implemented**:
- ✅ Extended Props interface with optional SEO parameters
- ✅ Default SEO values for all pages
- ✅ Dynamic canonical URL generation
- ✅ Full OG image URL resolution
- ✅ Primary meta tags (title, description, keywords)
- ✅ Open Graph tags for Facebook/LinkedIn
- ✅ Twitter Card tags
- ✅ Canonical URLs
- ✅ Robots meta tag support
- ✅ Apple touch icon
- ✅ Structured data (JSON-LD) for Organization schema

**Props Available**:
```typescript
{
  title: string;              // Required - Page title
  description?: string;       // Optional - Meta description
  keywords?: string;          // Optional - Meta keywords
  ogImage?: string;          // Optional - OG image path
  ogType?: string;           // Optional - OG type (default: "website")
  canonicalUrl?: string;     // Optional - Custom canonical URL
  noindex?: boolean;         // Optional - Prevent indexing
}
```

**Default Values**:
- **Description**: "SPLITDO - Blockchain-powered bill splitting on Solana. Join the token presale and split expenses with crypto. Lightning-fast settlements, near-zero fees."
- **Keywords**: "SPLITDO, Solana token, bill splitting, crypto presale, blockchain payments, expense sharing, DeFi, cryptocurrency"
- **OG Image**: "/splitdo/logo.svg"
- **Canonical Domain**: "https://splitdo.app"

---

#### 2. **App Pages Protection**
**Location**: `src/pages/app/[...all].astro`

**Features Implemented**:
- ✅ `noindex, nofollow` meta tag to prevent search engine indexing
- ✅ Basic meta tags for app dashboard
- ✅ Open Graph tags (minimal)
- ✅ App-specific title and description

**Why?** Protected app pages should NOT appear in search results as they require authentication.

---

### ✅ Page-Specific SEO

#### 3. **Home Page** (`/`)
**Location**: `src/pages/index.astro`

**SEO Configuration**:
- **Title**: "SPLITDO Token Presale | Blockchain Bill Splitting on Solana"
- **Description**: Dynamic presale price + "Join the SPLITDO token presale at $X. Split bills with crypto on Solana blockchain..."
- **Keywords**: "SPLITDO token, Solana presale, crypto bill splitting, blockchain payments, token sale, DeFi expense sharing, Solana token presale 2025"
- **OG Image**: "/phone_screens/WalletScreen_DARK.png"

**Target Searches**: Solana presale, crypto token sale, blockchain bill splitting

---

#### 4. **Tokenomics Page** (`/tokenomics`)
**Location**: `src/pages/tokenomics/index.astro`

**SEO Configuration**:
- **Title**: "SPLITDO Tokenomics | Token Distribution & Utility on Solana"
- **Description**: "SPLITDO token economics: 100M total supply, 31.5% strategic sale, Solana-based utility token. Transparent distribution, governance rights, staking rewards, and vesting schedules."
- **Keywords**: "SPLITDO tokenomics, token distribution, Solana token, crypto presale allocation, vesting schedule, utility token, DeFi governance"

**Target Searches**: SPLITDO tokenomics, Solana token distribution, crypto presale allocation

---

#### 5. **Download Page** (`/download`)
**Location**: `src/pages/download/index.astro`

**SEO Configuration**:
- **Title**: "Download SPLITDO App | iOS, Android & Web - Crypto Bill Splitting"
- **Description**: "Download SPLITDO bill splitting app. Split expenses with crypto on iOS, Android, or web. Real-time sync, Solana blockchain settlements..."
- **Keywords**: "SPLITDO app download, crypto bill splitting app, blockchain expense tracker, iOS Android crypto app, Solana payments app"

**Target Searches**: crypto bill splitting app, blockchain expense app download

---

#### 6. **About Page** (`/about`)
**Location**: `src/pages/about/index.astro`

**SEO Configuration**:
- **Title**: "About SPLITDO | Blockchain Bill Splitting Platform on Solana"
- **Description**: "SPLITDO combines expense tracking with blockchain settlements. Split bills globally with Solana-powered instant payments and near-zero fees."
- **Keywords**: "SPLITDO platform, blockchain bill splitting, crypto payments, Solana DeFi, expense management"

**Target Searches**: about SPLITDO, blockchain bill splitting platform

---

### ✅ Technical SEO Files

#### 7. **robots.txt**
**Location**: `public/robots.txt`

**Configuration**:
```
User-agent: *
Allow: /
Disallow: /app/          # Protected app pages
Disallow: /admin/        # Admin pages
Disallow: /admin-sign-in/
Disallow: /auth/         # Authentication pages
Disallow: /app-gibgo-auth/

Sitemap: https://splitdo.app/sitemap.xml
```

**Purpose**: Guide search engines to crawl public pages only, exclude private/auth pages

---

#### 8. **sitemap.xml**
**Location**: `public/sitemap.xml`

**Pages Included**:
1. `/` - Priority: 1.0 (Highest)
2. `/tokenomics` - Priority: 0.9
3. `/download` - Priority: 0.8
4. `/download/istore` - Priority: 0.7
5. `/about` - Priority: 0.7
6. `/features` - Priority: 0.7
7. `/privacy` - Priority: 0.3
8. `/terms-of-service` - Priority: 0.3

**Update Frequency**:
- Homepage: Daily (presale updates)
- Tokenomics/Download: Weekly/Monthly
- Legal pages: Yearly

---

#### 9. **Open Graph Images**
**Location**: `public/og/`

**Directory Created** with README for guidance.

**Required Images** (1200x630px):
- ⚠️ `home.png` - Homepage/Presale (NOT YET CREATED)
- ⚠️ `tokenomics.png` - Token distribution (NOT YET CREATED)
- ⚠️ `download.png` - App screenshots (NOT YET CREATED)
- ⚠️ `default.png` - Fallback image (NOT YET CREATED)

**Temporary Images** (Currently in use):
- Home: `/phone_screens/WalletScreen_DARK.png`
- Others: `/splitdo/logo.svg`

**Action Required**: Create proper 1200x630px OG images for better social media engagement.

---

## 🔍 Structured Data (Schema.org)

### Organization Schema
Implemented in `Layout.astro`:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SplitDo",
  "url": "https://splitdo.app",
  "logo": "https://splitdo.app/splitdo/logo.svg",
  "description": "Blockchain-powered bill splitting on Solana",
  "sameAs": []
}
```

**Note**: Add social media URLs to `sameAs` array when available (Twitter, Discord, Telegram, etc.)

---

## 📊 How to Use SEO System

### Adding SEO to New Pages

When creating a new page, simply pass SEO props to the Layout component:

```astro
---
import Layout from 'src/layouts/Layout.astro';
export const prerender = true;
---

<Layout 
  title="Your Page Title | SPLITDO"
  description="Your page description for search engines"
  keywords="keyword1, keyword2, keyword3"
  ogImage="/og/your-image.png"
  ogType="website"
>
  <!-- Your page content -->
</Layout>
```

### Preventing Page Indexing

For private or auth pages, add `noindex` prop:

```astro
<Layout 
  title="Private Page"
  noindex={true}
>
  <!-- Content -->
</Layout>
```

---

## ✅ Testing & Validation

### Before Launch - Test These Tools

1. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Test: Structured data validation

2. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Test: Open Graph tags

3. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Test: Twitter card preview

4. **Google Search Console**
   - Submit sitemap: `https://splitdo.app/sitemap.xml`
   - Monitor indexing status

5. **Mobile-Friendly Test**
   - URL: https://search.google.com/test/mobile-friendly
   - Ensure responsive design

6. **PageSpeed Insights**
   - URL: https://pagespeed.web.dev/
   - Check SEO impact on performance

---

## 📈 Expected SEO Outcomes

### Search Engine Benefits
- ✅ Better rankings for "Solana token presale" and "crypto bill splitting"
- ✅ Rich snippets in search results (organization info, site links)
- ✅ Improved click-through rates from SERP
- ✅ Proper indexing of public pages only

### Social Media Benefits
- ✅ Professional preview cards on Twitter, Facebook, LinkedIn
- ✅ Increased engagement from social shares
- ✅ Consistent branding across platforms
- ✅ Higher click-through rates from social posts

### Technical Benefits
- ✅ Clean crawling by search engines
- ✅ No duplicate content issues (canonical URLs)
- ✅ Proper separation of public/private content
- ✅ Fast discovery of new/updated pages

---

## 🚀 Next Steps & Recommendations

### Immediate Actions Required

1. **Create OG Images** ⚠️ HIGH PRIORITY
   - Design 1200x630px images for:
     - Homepage (presale focus)
     - Tokenomics (distribution chart)
     - Download (app screenshots)
     - Default fallback
   - Save in `/public/og/` directory
   - Update page files with new image paths

2. **Add Social Media Links**
   - Update Organization schema `sameAs` array in `Layout.astro`
   - Add links to: Twitter, Discord, Telegram, GitHub, etc.

3. **Submit to Search Engines**
   - Google Search Console: Submit sitemap
   - Bing Webmaster Tools: Submit sitemap
   - Monitor indexing progress

### Future Enhancements (Optional)

4. **FAQ Schema** (Low priority)
   - Add FAQ structured data to relevant pages
   - Helps with "People Also Ask" snippets

5. **Breadcrumb Schema**
   - Add breadcrumb navigation schema
   - Improves SERP display

6. **Article Schema**
   - For blog posts (if you add a blog)

7. **Product Schema**
   - For token presale pages (consider regulatory implications)

8. **Video Schema**
   - If you add promotional videos

---

## 🔐 Compliance & Legal Considerations

### Crypto Token SEO
- ✅ All descriptions are factual and non-promotional
- ✅ No misleading claims about returns or guarantees
- ⚠️ Consider adding disclaimers for regulatory compliance
- ⚠️ Review local regulations for crypto advertising

### Privacy
- ✅ Protected pages are noindexed
- ✅ User data pages are excluded from crawling
- ✅ Privacy policy linked in footer

---

## 📞 Support & Questions

### How to Update SEO

1. **Change Page Title/Description**:
   - Edit the specific page file in `/src/pages/`
   - Update the `<Layout>` props

2. **Update Default SEO**:
   - Edit `/src/layouts/Layout.astro`
   - Modify default values in the props destructuring

3. **Add New Page to Sitemap**:
   - Edit `/public/sitemap.xml`
   - Add new `<url>` entry with appropriate priority

4. **Update Robots.txt**:
   - Edit `/public/robots.txt`
   - Add new `Disallow` rules if needed

---

## 📝 Summary

### ✅ Completed
- [x] Flexible SEO props system in Layout.astro
- [x] Comprehensive meta tags (title, description, keywords)
- [x] Open Graph tags for social sharing
- [x] Twitter Card tags
- [x] Canonical URLs
- [x] Structured data (Organization schema)
- [x] robots.txt file
- [x] sitemap.xml file
- [x] SEO for all major pages (home, tokenomics, download, about)
- [x] Noindex for protected app pages
- [x] OG images directory structure

### ⚠️ Pending (Action Required)
- [ ] Create custom 1200x630px OG images
- [ ] Add social media URLs to structured data
- [ ] Submit sitemap to Google Search Console
- [ ] Test with Facebook/Twitter sharing validators
- [ ] Monitor search engine indexing

### 🎯 Success Metrics to Track
- Organic search traffic growth
- Keyword rankings (use Google Search Console)
- Social media click-through rates
- Page indexing status
- Core Web Vitals (ensure SEO doesn't hurt performance)

---

**Last Updated**: January 22, 2025
**Implementation Status**: ✅ COMPLETE (except OG images)
