# DropDeck Brand Identity Guide

**Tagline:** *"Every drop. One deck."*

---

## Brand Concept

DropDeck merges two powerful metaphors:

1. **Drop** — The universal delivery moment: packages dropped at your door, food dropped off, groceries delivered
2. **Deck** — A dual meaning:
   - *Card deck*: Multiple cards (delivery services) organized into one hand
   - *Command deck*: A control center dashboard for monitoring operations

The brand should feel **organized**, **unified**, and **in control** — transforming delivery chaos into calm oversight.

---

## Logo Concepts

### Concept A: "Stacked Cards"
A stylized stack of cards arranged in a cascading pattern, with the top card featuring a location pin or downward arrow (the "drop"). Suggests multiple sources unified into one organized view.

**Visual Description:**
- 3-4 rounded rectangles offset diagonally (card stack)
- Top card contains a location marker or down-arrow
- Clean geometric construction
- Works as both full logo and compact icon

### Concept B: "Grid Drop"
A 2×2 or 3×2 grid representing the dashboard layout, with one cell containing a downward-pointing chevron or location pin. Emphasizes the multi-pane dashboard interface.

**Visual Description:**
- Rounded square divided into grid cells
- One cell highlighted with drop indicator
- Minimal, app-icon-ready design
- Scalable from favicon to splash screen

### Concept C: "Convergence Pin"
Multiple delivery paths (lines) converging into a single location pin at center. Represents all deliveries flowing to one destination (your home) and one view (the app).

**Visual Description:**
- 4-6 lines radiating inward
- Central location pin or home icon
- Dynamic, movement-oriented
- Suggests real-time tracking

### Concept D: "DD Monogram"
Interlocking or stacked "D" letterforms creating an abstract shape that subtly suggests cards, layers, or a dashboard grid.

**Visual Description:**
- Two "D" shapes merged or overlapping
- Negative space creates depth/layers
- Typographic but iconic
- Strong brand recognition potential

---

## Recommended Direction: Hybrid "Card Grid"

Combining Concepts A and B for maximum versatility:

**Primary Mark:**
A rounded square (app-icon shape) containing a 2×2 grid where cards appear to be stacked/layered. The top-right cell features a subtle downward chevron or pin, indicating "drop."

**Why This Works:**
- Instantly readable as a dashboard/app
- Card metaphor visible but not cartoonish
- Works at all sizes (favicon → hero image)
- Distinct from existing delivery app logos
- Natural dark/light mode adaptation

---

## Color System

### Primary Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Deck Navy** | `#1E293B` | Primary brand color, dark mode backgrounds |
| **Drop Cyan** | `#06B6D4` | Accent, CTAs, active states, links |
| **Signal Green** | `#10B981` | Success states, "delivered" status |
| **Alert Amber** | `#F59E0B` | Warnings, "delayed" status |
| **Urgent Red** | `#EF4444` | Errors, "issue" status |

### Extended Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Slate 50** | `#F8FAFC` | Light mode background |
| **Slate 100** | `#F1F5F9` | Card backgrounds (light) |
| **Slate 200** | `#E2E8F0` | Borders, dividers (light) |
| **Slate 700** | `#334155` | Secondary text (light mode) |
| **Slate 800** | `#1E293B` | Primary text (light mode) |
| **Slate 900** | `#0F172A` | Dark mode background |

### Platform Accent Colors (for service identification)

| Platform | Color | Hex |
|----------|-------|-----|
| DoorDash | Red | `#FF3008` |
| Uber Eats | Black/Green | `#06C167` |
| Instacart | Green | `#43B02A` |
| Amazon | Orange | `#FF9900` |
| Walmart | Blue | `#0071DC` |
| Shipt | Green | `#00A859` |
| Costco | Red | `#E31837` |
| Sam's Club | Blue | `#0067A0` |
| Total Wine | Burgundy | `#6D2C41` |
| Drizly | Purple | `#6B46C1` |

---

## Typography

### Primary Typeface: Inter

**Why Inter:**
- Designed specifically for screens/UI
- Excellent legibility at small sizes (status text, ETAs)
- Full weight range (400-700 commonly used)
- Open source, no licensing concerns
- Native system font on many platforms

**Usage:**
| Element | Weight | Size | Tracking |
|---------|--------|------|----------|
| H1 (Page titles) | 700 (Bold) | 32px | -0.02em |
| H2 (Section heads) | 600 (Semibold) | 24px | -0.01em |
| H3 (Card titles) | 600 (Semibold) | 18px | 0 |
| Body | 400 (Regular) | 14-16px | 0 |
| Caption/Meta | 400 (Regular) | 12px | 0.01em |
| Status badges | 500 (Medium) | 12px | 0.02em |

### Monospace (for tracking IDs, technical data): JetBrains Mono

```
Tracking: 1Z999AA10123456784
ETA: 2024-01-15 14:30:00
```

### Logo Wordmark: Geist or Inter Bold

Clean, geometric sans-serif maintaining the technical-but-approachable feel.

---

## Logo Specifications

### Clear Space
Minimum clear space around logo = height of the "D" in DropDeck

### Minimum Sizes
- **Full logo (icon + wordmark):** 120px wide minimum
- **Icon only:** 24px minimum (favicon), 32px recommended minimum
- **Print:** 0.75" minimum width

### Logo Variants

1. **Full Horizontal** — Icon + "DropDeck" wordmark + tagline (optional)
2. **Full Stacked** — Icon above "DropDeck" wordmark
3. **Icon Only** — Square mark for app icons, favicons, compact spaces
4. **Wordmark Only** — Text-only for inline references

### Color Variants

| Variant | Icon | Wordmark | Background |
|---------|------|----------|------------|
| **Primary Dark** | Drop Cyan | White | Deck Navy |
| **Primary Light** | Deck Navy | Deck Navy | White/Slate 50 |
| **Monochrome Dark** | White | White | Any dark |
| **Monochrome Light** | Deck Navy | Deck Navy | Any light |
| **Single Color** | Drop Cyan | Drop Cyan | Transparent |

---

## Iconography Style

### Delivery Status Icons
Use Lucide icons (MIT licensed, React-compatible) with consistent styling:

- **Stroke width:** 1.5px (default) or 2px for emphasis
- **Size:** 16px (inline), 20px (buttons), 24px (feature icons)
- **Corner radius:** Rounded caps and joins

### Recommended Icons

| Status | Icon | Lucide Name |
|--------|------|-------------|
| Order Placed | 📋 | `clipboard-check` |
| Preparing | 🔧 | `chef-hat` or `package` |
| Shopper Assigned | 👤 | `user-check` |
| Shopping | 🛒 | `shopping-cart` |
| In Transit | 🚗 | `truck` or `car` |
| Arriving | 📍 | `map-pin` |
| Delivered | ✅ | `package-check` |
| Delayed | ⚠️ | `alert-triangle` |
| Issue | ❌ | `alert-circle` |

---

## UI Component Styling

### Cards (Delivery Panes)

```css
/* Light Mode */
.delivery-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Dark Mode */
.delivery-card-dark {
  background: #1E293B;
  border: 1px solid #334155;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* Borderless variant (per spec) */
.delivery-card-borderless {
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
}
```

### Platform Badges

Small, pill-shaped indicators with platform color:

```css
.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.platform-badge-doordash {
  background: rgba(255, 48, 8, 0.15);
  color: #FF3008;
}
```

### Map Overlay Styling

Platform icons on maps should:
- Use 32×32px container with 4px border-radius
- White background with subtle shadow
- Platform logo centered at ~20px
- Position anchored to driver/destination location

---

## Motion & Animation

### Principles
- **Purposeful:** Animation indicates state change or draws attention
- **Quick:** 150-300ms duration for UI transitions
- **Subtle:** Avoid bouncy/elastic easing; use ease-out

### Specific Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Card enter | Fade + slide up | 200ms | ease-out |
| Status change | Background pulse | 300ms | ease-in-out |
| Driver marker | Smooth position interpolation | 1000ms | linear |
| New delivery | Scale from 0.95 + fade | 250ms | ease-out |
| ETA update | Number ticker/flip | 150ms | ease-out |

---

## Voice & Tone

### Brand Personality
- **Calm:** Reduces delivery anxiety, presents information cleanly
- **Efficient:** No fluff, just the data you need
- **Reliable:** Always there, always accurate
- **Clever:** Subtle wit in empty states and edge cases

### Copy Examples

**Empty State (no active deliveries):**
> "Your deck is clear. Nothing incoming right now."

**Error State (platform connection failed):**
> "Lost connection to DoorDash. Reconnecting..."

**Success Toast (delivery arrived):**
> "Dropped! Your Instacart order has arrived."

**Onboarding:**
> "Connect your first service to start building your deck."

---

## Application Examples

### App Icon (iOS/Android/PWA)
- Deck Navy background (#1E293B)
- Card Grid icon in Drop Cyan (#06B6D4)
- Rounded corners per platform spec

### Favicon
- 32×32 and 16×16 versions
- Icon-only mark, simplified for small size
- Consider single-color cyan on transparent for browser tabs

### Splash Screen
- Deck Navy background
- Centered icon + wordmark in white/cyan
- Subtle radial gradient (optional)
- Tagline below in Slate 400

### Loading State
- Icon mark with subtle pulse animation
- Or: Individual cards animating into deck position

---

## File Deliverables Checklist

- [ ] Logo SVG (all variants)
- [ ] Logo PNG (1x, 2x, 3x for each variant)
- [ ] App icons (iOS, Android, PWA manifest sizes)
- [ ] Favicon package (ICO, PNG 16/32/180/192/512)
- [ ] Social preview image (1200×630 OG image)
- [ ] Color palette (ASE, JSON, CSS variables)
- [ ] Icon set (SVG sprite or individual files)
- [ ] Component library (Figma/Sketch source file)

---

## Quick Reference

```css
:root {
  /* Brand Colors */
  --dd-navy: #1E293B;
  --dd-cyan: #06B6D4;
  --dd-green: #10B981;
  --dd-amber: #F59E0B;
  --dd-red: #EF4444;
  
  /* Neutrals */
  --dd-slate-50: #F8FAFC;
  --dd-slate-100: #F1F5F9;
  --dd-slate-200: #E2E8F0;
  --dd-slate-700: #334155;
  --dd-slate-800: #1E293B;
  --dd-slate-900: #0F172A;
  
  /* Typography */
  --dd-font-sans: 'Inter', system-ui, sans-serif;
  --dd-font-mono: 'JetBrains Mono', monospace;
  
  /* Radii */
  --dd-radius-sm: 6px;
  --dd-radius-md: 12px;
  --dd-radius-lg: 16px;
  --dd-radius-full: 9999px;
}
```

---

*DropDeck — Every drop. One deck.*
