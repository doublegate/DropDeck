# DropDeck: Brand Guidelines

## Overview

This document establishes the brand identity standards for DropDeck, ensuring consistent representation across all touchpoints. These guidelines complement the [UI/UX Design System](./10-UI-UX-DESIGN-SYSTEM.md) with brand-specific rules.

---

## Table of Contents

1. [Brand Foundation](#brand-foundation)
2. [Logo System](#logo-system)
3. [Color Usage](#color-usage)
4. [Voice and Tone](#voice-and-tone)
5. [Platform Branding Considerations](#platform-branding-considerations)
6. [Application Examples](#application-examples)

---

## Brand Foundation

### Brand Name

**DropDeck** - Always written as one word with capital D's.

| Correct | Incorrect |
|---------|-----------|
| DropDeck | Drop Deck |
| DropDeck | Dropdeck |
| DropDeck | dropDeck |
| DropDeck | DROPDECK |

### Tagline

**Primary:** *"Every drop. One deck."*

**Alternative taglines (for specific contexts):**
- *"All your deliveries. One view."* (functional)
- *"Track everything. Switch nothing."* (feature-focused)
- *"The delivery dashboard."* (descriptive)

### Brand Concept

DropDeck merges two powerful metaphors:

1. **Drop** - The universal delivery moment:
   - Packages dropped at your door
   - Food dropped off
   - Groceries delivered
   - The completion moment users are waiting for

2. **Deck** - A dual meaning:
   - *Card deck*: Multiple cards (delivery services) organized into one hand
   - *Command deck*: A control center dashboard for monitoring operations

### Brand Personality

| Attribute | Expression |
|-----------|------------|
| **Organized** | Clean layouts, clear hierarchy, structured information |
| **Unified** | Consistent styling, seamless integration, single source of truth |
| **In Control** | Real-time data, actionable insights, user empowerment |
| **Modern** | Contemporary design, current technology, forward-thinking |
| **Trustworthy** | Secure handling, accurate information, reliable service |
| **Efficient** | Fast performance, minimal friction, streamlined workflows |

### Brand Promise

DropDeck transforms the fragmented delivery tracking experience into a calm, unified command center. Users feel **in control** rather than overwhelmed.

---

## Logo System

### Primary Logo (Card Grid Mark)

The DropDeck logo uses a "Card Grid" concept - a rounded square containing a 2x2 grid where cards appear stacked/layered, with one cell featuring a downward chevron indicating "drop."

```
+----------------+
|  [ ]    [ ]    |  <- Three neutral cards (platforms)
|                |
|  [ ]    [v]    |  <- One highlighted card with drop arrow
+----------------+
```

### Logo Files

| Variant | File | Use Case |
|---------|------|----------|
| **Full Logo** | `images/DropDeck-logo-card-grid.svg` | App icons, splash screens, marketing materials |
| **Horizontal (Light)** | `images/DropDeck-logo-horizontal.svg` | Headers on light backgrounds |
| **Horizontal (Dark)** | `images/DropDeck-logo-horizontal-dark.svg` | Headers on dark backgrounds |
| **Simple Icon** | `images/DropDeck-icon-simple.svg` | Favicons, small contexts (< 32px) |

### Logo Anatomy

```
  Icon Mark                    Wordmark
+------------+              +-----------+
|            |              |           |
| Card Grid  |    +         |  DropDeck |
| with Drop  |              |           |
+------------+              +-----------+

     |                           |
     v                           v
Rounded square              "Drop" in Deck Navy
with 2x2 grid,              "Deck" in Drop Cyan
drop arrow in
highlighted cell
```

### Logo Specifications

#### Clear Space

Maintain clear space equal to the height of the letter "D" in the wordmark around all sides of the logo.

```
          [  Clear Space = D height  ]
                    |
+-------------------v-------------------+
|                                       |
|    +------+   DropDeck                |
|    | ICON |                           |
|    +------+                           |
|                                       |
+---------------------------------------+
```

#### Minimum Sizes

| Context | Minimum Size |
|---------|--------------|
| Icon with wordmark | 120px wide |
| Icon only | 24px (favicon minimum) |
| Icon only (recommended) | 32px+ |
| Print (icon + wordmark) | 0.75" (19mm) wide |
| Print (icon only) | 0.25" (6mm) |

### Logo Color Variants

#### Primary Variants

| Variant | Icon Background | Icon Cards | Highlight | Drop Arrow | Wordmark |
|---------|-----------------|------------|-----------|------------|----------|
| **On Light** | Slate 800 | Slate 600 | Cyan 500 | White | Slate 800 + Cyan 500 |
| **On Dark** | Slate 800 | Slate 600 | Cyan 500 | White | White + Cyan 500 |

#### Monochrome Variants (When color is limited)

| Variant | All Elements |
|---------|--------------|
| **Dark on Light** | Slate 800 |
| **Light on Dark** | White |
| **Single Accent** | Cyan 500 |

### Logo Don'ts

1. **Do not** stretch or distort the logo
2. **Do not** rotate the logo
3. **Do not** change the colors outside approved variants
4. **Do not** add effects (shadows, gradients, outlines)
5. **Do not** place on busy backgrounds without sufficient contrast
6. **Do not** use low-resolution versions
7. **Do not** separate the icon from wordmark inappropriately
8. **Do not** modify the grid pattern or drop arrow
9. **Do not** animate the logo without approval

---

## Color Usage

### Primary Color Palette

| Color | Name | Hex | Usage |
|-------|------|-----|-------|
| ![#1E293B](https://via.placeholder.com/20/1E293B/1E293B) | **Deck Navy** | `#1E293B` | Logo, headers, primary text (light mode), backgrounds (dark mode) |
| ![#06B6D4](https://via.placeholder.com/20/06B6D4/06B6D4) | **Drop Cyan** | `#06B6D4` | Accent, CTAs, links, active states, logo highlight |

### Secondary Colors

| Color | Name | Hex | Usage |
|-------|------|-----|-------|
| ![#10B981](https://via.placeholder.com/20/10B981/10B981) | **Signal Green** | `#10B981` | Success, delivered status |
| ![#F59E0B](https://via.placeholder.com/20/F59E0B/F59E0B) | **Alert Amber** | `#F59E0B` | Warnings, delays |
| ![#EF4444](https://via.placeholder.com/20/EF4444/EF4444) | **Urgent Red** | `#EF4444` | Errors, issues |

### Color Usage Rules

#### Drop Cyan

- **Use for:** Primary actions (buttons, links), active states, focus indicators, brand accent
- **Avoid:** Large background areas, body text, error states

#### Deck Navy

- **Use for:** Headers, primary text (light mode), card backgrounds (dark mode), logo
- **Avoid:** Small text on dark backgrounds (contrast issues)

#### Signal Green

- **Use for:** Success messages, "delivered" status, positive confirmations
- **Avoid:** Primary actions, decorative elements

#### Alert Amber

- **Use for:** Warnings, "delayed" status, caution messages
- **Avoid:** Success states, primary text (contrast issues)

#### Urgent Red

- **Use for:** Errors, "issue" status, destructive actions
- **Avoid:** Success states, decorative elements, excessive use

### Color Accessibility

All color combinations must meet WCAG 2.1 AA standards:
- **Text:** Minimum 4.5:1 contrast ratio
- **UI Components:** Minimum 3:1 contrast ratio
- **Large Text (18pt+):** Minimum 3:1 contrast ratio

See [10-UI-UX-DESIGN-SYSTEM.md](./10-UI-UX-DESIGN-SYSTEM.md#accessibility) for specific contrast ratios.

---

## Voice and Tone

### Brand Voice Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Clear** | Simple, jargon-free language | "Your order is on the way" not "Delivery in transit" |
| **Helpful** | Solution-oriented, proactive | "Connect your accounts to get started" |
| **Confident** | Assured but not arrogant | "Track all your deliveries in one place" |
| **Friendly** | Warm but professional | "Great! Your Instacart is connected." |
| **Concise** | Brief, scannable content | Short sentences, bullet points |

### Tone Variations by Context

| Context | Tone | Example |
|---------|------|---------|
| **Success** | Celebratory, brief | "Delivered! Your order arrived at 5:30 PM." |
| **Error** | Empathetic, helpful | "Oops, something went wrong. Let's try again." |
| **Instruction** | Clear, direct | "Tap Connect to link your DoorDash account." |
| **Waiting** | Reassuring, informative | "Hang tight! Your driver is 8 minutes away." |
| **Warning** | Calm, informative | "Heads up: Your delivery is running about 15 minutes late." |

### Writing Guidelines

#### Do

- Use active voice ("Your driver is arriving" not "Arrival is imminent")
- Address the user directly ("you", "your")
- Use contractions naturally ("you're", "it's", "don't")
- Keep sentences under 20 words when possible
- Lead with the most important information
- Use sentence case for headings and buttons

#### Don't

- Use technical jargon or internal terminology
- Be overly casual or use slang
- Use ALL CAPS (except for acronyms)
- Use exclamation points excessively
- Blame the user for errors
- Make promises you can't keep

### UI Copy Patterns

#### Status Messages

| Pattern | Example |
|---------|---------|
| **[Action] + [Timeline]** | "Arriving in 5 minutes" |
| **[Status] + [Location]** | "Out for delivery - 2.1 mi away" |
| **[Completion] + [Time]** | "Delivered at 3:45 PM" |

#### Error Messages

| Pattern | Example |
|---------|---------|
| **[What happened] + [What to do]** | "Connection lost. Tap to reconnect." |
| **[Empathy] + [Solution]** | "That didn't work. Let's try again." |

#### Empty States

| Pattern | Example |
|---------|---------|
| **[Context] + [Action]** | "No active deliveries. Connect your platforms to get started." |

---

## Platform Branding Considerations

### Third-Party Platform Representation

When displaying delivery platform brands (DoorDash, Uber Eats, Instacart, etc.), follow these guidelines:

#### Platform Logos and Icons

1. **Use official assets** when available and permitted
2. **Maintain aspect ratios** - never stretch platform logos
3. **Respect clear space** requirements of each platform
4. **Use approved colors** - platform brand colors, not modified versions

#### Platform Identification

| Method | Usage |
|--------|-------|
| **Icon + Name** | Delivery cards, platform lists |
| **Icon Only** | Map markers, compact views |
| **Name Only** | Text contexts, filters |
| **Color Accent** | Subtle badge backgrounds |

#### Platform Color Usage

Platform colors should be used sparingly for identification, not as primary design elements:

```css
/* Acceptable: Subtle badge background */
.platform-badge-doordash {
  background: rgba(255, 48, 8, 0.15);
  color: #FF3008;
}

/* Avoid: Large colored areas */
.card-doordash {
  background: #FF3008; /* Too prominent */
}
```

### Trademark Considerations

1. Platform names and logos are trademarks of their respective owners
2. DropDeck does not claim ownership of third-party brands
3. Display platform brands for identification purposes only
4. Include appropriate attribution where required

---

## Application Examples

### App Header (Light Mode)

```
+------------------------------------------------------------------+
|  [Logo Horizontal Light]        [Settings] [Profile]             |
+------------------------------------------------------------------+
```

### App Header (Dark Mode)

```
+------------------------------------------------------------------+
|  [Logo Horizontal Dark]         [Settings] [Profile]             |
+------------------------------------------------------------------+
```

### Delivery Card

```
+------------------------------------------+
| [Platform Icon]  Platform Name     8 min |
|------------------------------------------|
|                                          |
|     +----------------------------+       |
|     |                            |       |
|     |    Map with branded        |       |
|     |    driver marker           |       |
|     |                            |       |
|     +----------------------------+       |
|                                          |
|  [Status Badge]  Distance                |
+------------------------------------------+
```

### Marketing Use

When using the DropDeck brand in marketing materials:

1. **Hero Image:** Show the app dashboard with multiple delivery cards
2. **Feature Callouts:** Use Drop Cyan for accent highlights
3. **Background:** Prefer Slate 50 (light) or Slate 900 (dark)
4. **Typography:** Inter for all marketing text

### Favicon and App Icon

| Platform | Size | Format | Notes |
|----------|------|--------|-------|
| Web Favicon | 32x32 | ICO, PNG | Use simple icon variant |
| Apple Touch | 180x180 | PNG | Use full icon with rounded corners |
| Android | 192x192, 512x512 | PNG | Use full icon |
| Open Graph | 1200x630 | PNG | Use horizontal logo on brand background |

---

## Brand Asset Checklist

### Required Assets

- [ ] Primary logo (SVG, PNG @1x, @2x, @3x)
- [ ] Dark mode logo variant
- [ ] Simple icon for small contexts
- [ ] Favicon (ICO, PNG)
- [ ] App icon (all platform sizes)
- [ ] Open Graph image
- [ ] Email header image

### Color Definitions

- [ ] CSS custom properties file
- [ ] Tailwind theme configuration
- [ ] Figma/design tool color library
- [ ] Brand palette document (PDF)

### Typography

- [ ] Inter font files (woff2)
- [ ] JetBrains Mono font files (woff2)
- [ ] Font loading configuration

---

## Related Documents

- [10-UI-UX-DESIGN-SYSTEM.md](./10-UI-UX-DESIGN-SYSTEM.md) - Complete design system
- [00-PROJECT-OVERVIEW.md](./00-PROJECT-OVERVIEW.md) - Project vision
- [03-TECHNOLOGY-STACK.md](./03-TECHNOLOGY-STACK.md) - Implementation technologies

---

*Document Version: 1.0 | Last Updated: January 2026*
