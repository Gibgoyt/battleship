# Open Graph Images Directory

This directory contains social media preview images (OG images) for SPLITDO pages.

## Required Images

### Specifications
- **Dimensions**: 1200x630 pixels (Facebook/Twitter recommended size)
- **Format**: PNG or JPG
- **File size**: Under 8MB (under 5MB recommended)
- **Aspect ratio**: 1.91:1

### Images Needed

1. **home.png** - Homepage/Presale image
   - Should feature: SPLITDO logo, token price, "Presale Live" badge
   - Currently using: `/phone_screens/WalletScreen_DARK.png` (temporary)

2. **tokenomics.png** - Tokenomics page image
   - Should feature: Token distribution donut chart, 100M supply
   - Currently using: Default logo (temporary)

3. **download.png** - Download page image
   - Should feature: App screenshots on phone mockups, iOS/Android badges
   - Currently using: Default logo (temporary)

4. **default.png** - Fallback image for other pages
   - Should feature: SPLITDO logo with tagline
   - Currently using: `/splitdo/logo.svg` (temporary)

## How to Add Images

1. Create images at 1200x630px
2. Save them in this directory (`/public/og/`)
3. Update the respective page files in `/src/pages/` to use the new images:
   - Home: `ogImage="/og/home.png"`
   - Tokenomics: `ogImage="/og/tokenomics.png"`
   - Download: `ogImage="/og/download.png"`

## Testing

After adding images, test social media previews:
- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: Post preview when sharing

## Current Temporary Images

- Home page: Using `/phone_screens/WalletScreen_DARK.png`
- Other pages: Using `/splitdo/logo.svg`

Replace these with proper 1200x630 OG images for better social media engagement.
