# Playmate Labs — Shopify Theme

A custom Shopify theme for Playmate Labs, built with Liquid, CSS, and JavaScript.

## Theme Structure

```
playmate-labs-theme/
├── assets/          # CSS, JS, and other static files
├── config/          # Theme settings schema and data
├── layout/          # Base layout templates (theme.liquid)
├── locales/         # Translation files
├── sections/        # Reusable page sections
├── snippets/        # Reusable code snippets
└── templates/       # Page templates
```

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Development branch — active development goes here |
| `production` | Stable production branch — Shopify installs from this |

## Installing the Theme in Shopify

### Option A — GitHub Integration (Recommended)

1. In your Shopify Admin, go to **Online Store → Themes**
2. Click **Add theme → Connect from GitHub**
3. Authorise Shopify to access your GitHub account
4. Select this repository: `JORDANUNDERWOOD1008/playmate-labs-theme`
5. Select the **`production`** branch
6. Click **Connect**
7. After the theme is imported, click **Publish**

### Option B — Shopify CLI

```bash
# Clone the repo
git clone https://github.com/JORDANUNDERWOOD1008/playmate-labs-theme.git
cd playmate-labs-theme

# Push to your store (replace with your store URL)
shopify theme push --store=YOUR-STORE.myshopify.com
```

### Option C — ZIP Upload

1. Download the ZIP of the `production` branch from GitHub
2. In Shopify Admin → **Online Store → Themes**
3. Click **Add theme → Upload zip file**
4. Upload the downloaded ZIP

## Post-Installation Setup

After installing the theme, configure the following in **Online Store → Themes → Customize**:

### Navigation Menus (Online Store → Navigation)
Create these menus:
- `main-menu` — Primary navigation
- `footer-shop` — Footer Shop column links
- `footer-explore` — Footer Explore column links
- `footer-help` — Footer Help column links

### Page Templates
Assign these templates to the matching pages:
| Page | Template |
|------|----------|
| About | `page.about` |
| Community / Rewards | `page.community` |
| Events | `page.events` |
| 5-Day Experience | `page.experience` |
| Monthly Drops | `page.drops` |

### Collections Required
Create these collections in **Products → Collections**:
- `monthly-drops` — Monthly drop products
- `ritual-add-ons` — Cart cross-sell / upsell products
- `all` — All products (auto-created by Shopify)

### Theme Settings (Customize → Theme Settings)
- **Announcement Bar**: Set text and optional link URL
- **Newsletter Popup**: Configure heading and CTA text
- **Social Links**: Add Instagram, TikTok, Pinterest, Spotify URLs
- **Brand Colours**: Pre-configured (burgundy `#6B1E3A`, gold `#C9A96E`)

## Development Workflow

```bash
# Checkout main for development
git checkout main

# Make your changes, then commit
git add .
git commit -m "feat: your change description"
git push origin main

# When ready to go live — merge to production
git checkout production
git merge main
git push origin production
# Shopify auto-updates from the production branch
```

## Assets

| File | Purpose |
|------|---------|
| `global.css` | Global design system, typography, variables |
| `components.css` | Shared UI components |
| `home.css` | Homepage-specific styles |
| `shop.css` | Collection / shop page styles |
| `product.css` | Product detail page styles |
| `experience.css` | 5-Day Experience page styles |
| `drops.css` | Monthly Drops page styles |
| `events.css` | Events page styles |
| `main.js` | Core JS (cart, nav, animations) |
| `cart-api.js` | AJAX cart operations |
| `home.js` | Homepage JS (parallax, counters) |
| `shop.js` | Shop page JS (filter, sort) |
| `product.js` | Product page JS (variants, gallery) |

## Brand

- **Primary**: Burgundy `#6B1E3A`
- **Accent**: Gold `#C9A96E`
- **Light**: Cream `#F5EFE6`
- **Dark**: Espresso `#1A0A06`
- **Heading Font**: Playfair Display
- **Body Font**: Inter

---

Built with ❤️ for Playmate Labs
