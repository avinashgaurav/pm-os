# Design System Reference: Pine Labs + Harness.io

Extracted via live CSS analysis and page source inspection (2026-03-30).

---

## 1. Pine Labs (pinelabs.com)

### Overall Aesthetic

Modern fintech, clean and confident. Light-mode primary with deep teal/green brand identity. Rounded, approachable shapes paired with bold typography. Heavy use of organic curves, soft gradients, and generous whitespace. The design language says "premium fintech" without being sterile -- there is warmth in the green/lime palette.

### Color Palette

#### Brand Primaries (Teal-Green Family)
| Token | Hex | Usage |
|-------|-----|-------|
| Deepest teal | `#001B1F` | Darkest background, footer |
| Dark teal | `#002326` / `#002328` | Dark sections |
| Rich teal | `#00262C` | Section backgrounds |
| Deep green | `#003434` / `#003535` | Primary dark surface |
| Medium teal | `#005656` | Secondary dark surface, radial glows |
| Teal-dark | `#01393D` / `#0E393D` | Card backgrounds in dark sections |
| Green-dark | `#014D3A` | Accent dark |
| Brand teal (muted) | `#012E32` | Semi-transparent overlays |

#### Brand Accents (Green-Lime Family)
| Token | Hex | Usage |
|-------|-----|-------|
| Bright mint | `#00C68C` / `#00B47F` | Primary CTA, links, highlights |
| Teal-cyan | `#13BBCA` | Secondary accent, hover states |
| Soft green | `#36CC8B` | Buttons, success states |
| Light green | `#50D387` | Gradient endpoints |
| Lime-yellow | `#D0F255` / `#C6F224` | Bold accent, badges, highlights |
| Darker lime | `#B4DC21` | Secondary lime accent |
| Light mint | `#A1FFBD` | Glow effects |
| Seafoam | `#8AE5CA` | Soft accent |

#### Neutrals
| Token | Hex | Usage |
|-------|-----|-------|
| True black | `#000000` | Text on light |
| Near black | `#040404` / `#1A1A1A` / `#1E1E1E` | Primary text |
| Charcoal | `#414141` / `#4B4949` | Secondary text |
| Medium grey | `#A7A7A7` / `#B3B3B3` | Muted text, borders |
| Light grey | `#D3D3D3` / `#E0E0E0` / `#E5E5E5` / `#E7E7E7` | Borders, dividers |
| Off-white green | `#F1F3EF` / `#F2F4F0` / `#F5F7F4` | Section backgrounds |
| Near white | `#F7F7F7` / `#F8F9F7` / `#FAFAFA` / `#FAFBF9` | Light surfaces |
| Pure white | `#FFFFFF` | Cards, primary bg |

#### Warm Accents
| Token | Hex | Usage |
|-------|-----|-------|
| Red/error | `#FB3748` / `#FE6B6B` | Error states |
| Coral | `#FF826C` | Warning accent |
| Warm yellow | `#FFCB77` | Highlight |

#### Functional (shadcn/Tailwind foundation)
| Token | HSL | Usage |
|-------|-----|-------|
| `--background` | `0 0% 100%` | Page background |
| `--foreground` | `0 0% 3.9%` | Primary text |
| `--primary` | `0 0% 9%` | Primary elements |
| `--primary-foreground` | `0 0% 98%` | Text on primary |
| `--secondary` | `0 0% 96.1%` | Secondary bg |
| `--muted` | `0 0% 96.1%` | Muted surfaces |
| `--muted-foreground` | `0 0% 45.1%` | Muted text |
| `--destructive` | `0 84.2% 60.2%` | Error/danger |
| `--border` | `0 0% 89.8%` | Default border |
| `--radius` | `0.5rem` | Base border-radius |

### Typography

#### Font Stack
- **Headings**: `PPTelegraf` (custom geometric sans)
- **Body**: `Poppins` (Google Fonts) -- CSS variable: `--poppins-font: "Poppins","Poppins Fallback"`
- **Monospace/Display**: `Monoblock` (variable weight 100-900)
- **System fallback**: `system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`

#### Heading Scale
| Level | Size | Weight | Letter-spacing | Line-height |
|-------|------|--------|----------------|-------------|
| Display XL | 72px | 700-800 | -4% | ~104% |
| Display | 62px | 700 | -3% | ~104% |
| H1 | 52-54px | 700 | -2% | ~104-120% |
| H2 | 44px | 600-700 | -2% | ~120% |
| H3 | 34-36px | 600 | -1% | ~130% |
| H4 | 28px | 600 | -1% | ~140% |
| H5 | 24px | 500-600 | 0% | ~140% |
| H6 | 20px | 500 | 0% | ~150% |

#### Body Scale
| Variant | Size | Weight | Letter-spacing | Line-height |
|---------|------|--------|----------------|-------------|
| Body LG | 18px | 400-500 | 0.02em | 160% |
| Body | 16px | 400 | 0.02em | 150% |
| Body SM | 14px | 400-500 | 0.02em | 150% |
| Caption | 12px | 400-500 | 0.04em | 140% |
| Overline | 10-11px | 600 | 0.1em | 140% |

### Gradients

```css
/* Hero/feature gradient -- dark teal to mint (most distinctive) */
linear-gradient(180deg, #003535, #00c68b)

/* Frosted glass overlay */
linear-gradient(125.04deg, rgba(1,46,50,0.57) 18.75%, rgba(19,187,202,0.57) 90.09%)

/* Complex atmospheric gradient */
linear-gradient(13.1deg, rgba(87,188,152,0.6) -27.51%, #0E393D 37.08%, rgba(14,57,61,0.62) 72.35%)

/* Soft section fade */
linear-gradient(179.94deg, #F7F7F7 0.05%, #E0E7E0 99.95%)
linear-gradient(179.94deg, #ffffff 40.05%, #E0E7E0 89.95%)

/* Content fade overlays */
linear-gradient(180deg, rgba(241,243,239,0), #F1F3EF 50.24%)
linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.6))

/* Radial glow (used as decorative orb) */
radial-gradient(50% 50% at 50% 50%, #005656, rgba(0,86,86,0))
```

### Card & Component Styles

#### Cards
```css
/* Standard card */
border-radius: 16px;  /* primary card radius */
background: #FFFFFF;
box-shadow: 0px 3.81px 48px 0px rgba(193, 202, 184, 0.35);
padding: 24px - 32px;

/* Elevated card */
box-shadow: 0px 9.81px 26.04px 0px rgba(2, 2, 2, 0.08);

/* Feature card (on dark) */
background: #01393D;
border-radius: 20px;
box-shadow: 0px 0px 12.91px 2.58px rgba(0, 38, 44, 0.08), 0px 12px 24px 0px rgba(193, 202, 184, 0.2);

/* Glass card */
background: rgba(1, 58, 63, 0.71);  /* #013a3fb5 */
backdrop-filter: blur(40px);
border-radius: 24px;

/* Inset glow effect */
box-shadow: inset 0px 0px 16px 6px rgba(255, 255, 255, 0.5);
```

#### Border-Radius System
| Usage | Value |
|-------|-------|
| Small (chips, tags) | 6px - 8px |
| Default (inputs, small cards) | 12px |
| Medium (cards) | 16px |
| Large (feature cards) | 20px - 24px |
| XL (hero elements) | 32px - 40px |
| Pill (buttons, badges) | 50px / 100px / 9999px |
| Circle | 50% / 100% |

### Button Styles

```css
/* Primary CTA */
background: #00C68C;  /* or #36CC8B */
color: #001B1F;       /* dark text on green */
border-radius: 50px;  /* full pill shape */
padding: 14px 24px;
font-weight: 600;
font-size: 16px;
transition: all 0.3s ease;

/* Secondary / Ghost */
background: transparent;
border: 1px solid #E5E5E5;  /* or #B3B3B3 on dark */
color: #1A1A1A;  /* or #FFFFFF on dark */
border-radius: 50px;
padding: 14px 24px;

/* Lime accent button (emphasis) */
background: #D0F255;
color: #003434;
border-radius: 50px;

/* Dark button */
background: #003434;
color: #FFFFFF;
border-radius: 50px;
```

### Decorative Elements

- **Gradient orbs**: Large blurred circles using `radial-gradient` with `#005656` fading to transparent, with `filter: blur(80px)` to `blur(107.61px)`
- **Background blurs**: Multiple blur layers at 40px, 80px, 99px, 107px creating atmospheric depth
- **Clip-path reveals**: `polygon(2% 2%, 98% 2%, 98% 98%, 2% 98%)` for scroll-triggered reveals
- **Marquee animation**: 50s linear infinite scroll for logo strips
- **Zoom-out on scroll**: Scale 1.06 to 1 over 1s ease-out
- **Fade-in reveals**: 0.4s opacity animations triggered by AOS (Animate on Scroll)

### Navigation

- Horizontal nav with dropdown menus
- Logo: PNG `/img/logo.png`
- Sections: Products, Solutions, Developers, Resources
- CTA: "Contact us" as primary button
- Dropdown indicator: SVG chevron icon
- Mobile: hamburger menu pattern

### Spacing System

Follows a loose 4px/8px grid:
```
4px, 8px, 12px, 14px, 16px, 20px, 24px, 25px, 32px, 40px, 56px, 60px, 80px, 120px
```

Section padding typically: `60px - 120px` vertical, content max-width appears to be around `1200px - 1400px`.

---

## 2. Harness.io (harness.io)

### Overall Aesthetic

Dark-mode-first enterprise SaaS. Deep navy-black backgrounds with high-contrast white text and vibrant gradient accents (cyan, purple, magenta). The design evokes a developer-tools / DevOps dashboard feel -- technical, precise, but with sophisticated motion and gradient treatments. Think: "premium dark IDE meets marketing site."

### Color Palette

#### Dark Surface Hierarchy
| Token | Value | Usage |
|-------|-------|-------|
| Primary surface | `#0b0b0d` / `#0a0e27` | Main page background |
| Surface overlay L1 | `rgba(255, 255, 255, 0.06)` | Inactive cards, tab backgrounds |
| Surface overlay L2 | `rgba(255, 255, 255, 0.10)` | Buttons, interactive elements |
| Surface overlay L3 | `rgba(255, 255, 255, 0.25)` | Hover states, elevated elements |

#### Text Colors
| Token | Value | Usage |
|-------|-------|-------|
| Primary text | `#FFFFFF` / `#FCFCFF` | Headings, primary content |
| Secondary text | `#B0B1C3` | Descriptions, muted content |
| Body text | `#333333` | Light-mode fallback |

#### Brand Accent Colors
| Token | Value | Usage |
|-------|-------|-------|
| Primary blue | `#0677D4` | CTAs, links, form borders, active states |
| Bright cyan | `#2BB1F2` | Form highlights, accent borders |
| Electric cyan | `#6EEEF7` | Gradient start |
| Purple | `#908AFF` | Gradient midpoint |
| Magenta/pink | `#D18BE9` | Gradient endpoint |

#### Status Colors
| Token | Usage |
|-------|-------|
| Green | Success states, healthy indicators, checkmarks |
| Red | Error, failure states |
| Orange | Warning states |

#### Gradient System
```css
/* Signature hero gradient (most distinctive -- cyan to purple to magenta) */
linear-gradient(320deg, #6eeef7 0%, #908aff 45%, #d18be9 100%)

/* Applied with blur for atmospheric glow */
filter: blur(3px);
```

### Typography

#### Font Stack
- **Primary**: `Inter, sans-serif`
- **Weights**: 400 (regular), 600 (semi-bold), 700 (bold)

#### Scale
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Hero headline | ~48-64px (responsive) | 700 | Hero section |
| Section heading | ~32-40px | 700 | Section titles |
| Card title | ~20-24px | 600 | Module/product cards |
| Body | 16px | 400 | Paragraphs |
| Body small | 13-14px | 400 | Descriptions, captions |
| Caption | 12-13px | 400-600 | Labels, badges |

### Card & Component Styles

#### Product/Module Cards
```css
/* Tab-style card (inactive) */
background: rgba(255, 255, 255, 0.06);
border-radius: 10px;          /* desktop */
/* border-radius: 6px; */     /* mobile */
min-height: 13.7rem;          /* desktop */
/* min-height: 15.31rem; */   /* tablet */
/* min-height: 6rem; */       /* mobile */
transition: background-color 600ms ease, transform 600ms ease;

/* Active card */
background: rgba(255, 255, 255, 0.06);  /* with .w--current class */

/* Content area */
max-width: 1400px;
margin: 0 auto;
```

#### Media Containers
```css
border-radius: 12px;   /* for Lottie/video containers */
aspect-ratio: 16 / 9;
/* mobile: max-height: 400px */
```

#### Form Elements
```css
/* Input fields */
border: 1px solid #0677D4;
border-radius: 0.5rem;  /* 8px */
padding: 10px;

/* Form card shadow */
box-shadow: 0 2px 8px 0 rgb(255 255 255 / 35%);
```

### Button Styles

```css
/* Primary CTA (light button on dark bg) */
background: #FFFFFF;
color: #000000;
font-weight: 600;
border-radius: 5px;
padding: 10px 20px;
box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.05);

/* Form submit */
background: #FFFFFF;
font-weight: 600;
box-shadow: 0 2px 8px 0 rgb(255 255 255 / 35%);

/* Chevron icon in buttons */
/* SVG arrow-right appended to CTA text */

/* Ghost / pause button */
width: 37px;
height: 37px;
background: rgba(255, 255, 255, 0.1);
border-radius: 50%;  /* circular */
opacity: 0.2;
/* hover: opacity: 1; background: rgba(255, 255, 255, 0.25) */
transition: opacity 0.2s ease;
```

### Animation System

```css
/* Content reveal (staggered card entrance) */
opacity: 0;
transform: translateY(12px);
transition: opacity 0.65s cubic-bezier(0.22, 0.61, 0.36, 1);

/* Media entrance */
@keyframes easeInMedia {
  from { transform: scale(0.965); }
  to   { transform: scale(1); }
}
/* Duration: 700ms, delay: 0.12s */

/* Background entrance */
@keyframes easeInBg {
  from { transform: scale(0.99); }
  to   { transform: scale(1); }
}
/* Duration: 700ms, delay: 0.42s */

/* Logo carousel */
@keyframes logoScroll {
  /* continuous horizontal scroll, pauses on hover */
}

/* Easing curve (signature) */
cubic-bezier(0.22, 0.61, 0.36, 1)  /* smooth deceleration */
```

### Navigation

- Dark background (`#0b0b0d`) with white text
- Mega-menu dropdowns organized by category (DevOps & Automation, Security & Compliance, etc.)
- Dropdown arrows: custom SVG `nav-dropdown-arrow.svg`
- Search: Coveo/Atomic-powered with trending searches
- CTAs: "Sign up" / "Sign in" / "Get demo" in header
- Active link: `.w--current` class (no explicit color override -- inherits)
- Built on Webflow (`.w-` class prefix)

### Decorative Elements

- **Lottie animations**: JSON-based animations with manual pause/play controls positioned at `bottom: 30px; right: 37px`
- **Gradient glow orbs**: The signature `linear-gradient(320deg, #6eeef7, #908aff, #d18be9)` applied with `blur(3px)` as background decoration
- **Staggered reveals**: Content enters with 12px upward translation and 0.65s fade
- **Scale-on-enter**: Media scales from 0.965 to 1.0 creating a subtle zoom-in
- **Reduced motion support**: `@media (prefers-reduced-motion: reduce)` disables all entry animations
- **Mutation observer**: Dynamic DOM monitoring for script optimization
- **"NEW" badges**: Inline label badges on product cards
- **"free" tier labels**: Small labels indicating free-tier products

### Responsive Breakpoints
```
1199px  -- large tablet / small desktop
991px   -- tablet
768px   -- large mobile / small tablet
500px   -- mobile
```

---

## 3. Dark-Mode Adaptation Notes (For Your App)

### Recommended Hybrid Approach

Combining both design languages for a dark-mode PM tool:

#### Surface Colors (Harness-inspired hierarchy)
```css
--surface-base:    #0b0b0d;              /* deepest background */
--surface-1:       rgba(255,255,255,0.04); /* subtle card bg */
--surface-2:       rgba(255,255,255,0.06); /* card bg */
--surface-3:       rgba(255,255,255,0.10); /* elevated / hover */
--surface-4:       rgba(255,255,255,0.15); /* active / selected */
```

#### Accent System (Pine Labs green-teal adapted for dark)
```css
--accent-primary:   #00C68C;   /* Pine Labs mint green */
--accent-secondary: #13BBCA;   /* Pine Labs teal-cyan */
--accent-lime:      #D0F255;   /* Pine Labs lime (for highlights/badges) */
--accent-blue:      #0677D4;   /* Harness blue (for links/interactive) */
```

#### Gradient Treatments
```css
/* Atmospheric glow (Harness-style, Pine Labs colors) */
background: radial-gradient(ellipse at 20% 50%, rgba(0,198,140,0.12) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(19,187,202,0.08) 0%, transparent 50%);

/* Card accent border */
border-image: linear-gradient(180deg, #003535, #00c68b) 1;

/* Hero glow (Harness-inspired) */
background: linear-gradient(320deg, rgba(0,198,140,0.3) 0%, rgba(19,187,202,0.2) 45%, rgba(0,86,86,0.1) 100%);
filter: blur(80px);
```

#### Typography Recommendation
```css
--font-heading: 'Inter', sans-serif;       /* Harness-style clean headings */
--font-body:    'Poppins', sans-serif;      /* Pine Labs warmth for body */
--font-mono:    'JetBrains Mono', monospace; /* for any code/data display */
```

#### Component Patterns
```css
/* Card (hybrid) */
background: rgba(255, 255, 255, 0.04);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 16px;     /* Pine Labs roundedness */
padding: 24px;
transition: all 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);  /* Harness easing */

/* Card hover */
background: rgba(255, 255, 255, 0.08);
border-color: rgba(255, 255, 255, 0.12);
transform: translateY(-2px);

/* Button primary */
background: #00C68C;
color: #0b0b0d;
border-radius: 8px;      /* Harness precision, not full pill */
padding: 10px 20px;
font-weight: 600;

/* Button secondary */
background: rgba(255, 255, 255, 0.06);
color: #FCFCFF;
border: 1px solid rgba(255, 255, 255, 0.12);
border-radius: 8px;

/* Sidebar (Harness dashboard feel) */
background: rgba(255, 255, 255, 0.03);
border-right: 1px solid rgba(255, 255, 255, 0.06);
width: 260px;

/* Active sidebar item */
background: rgba(0, 198, 140, 0.12);
color: #00C68C;
border-radius: 8px;

/* Badge / tag */
background: rgba(208, 242, 85, 0.15);  /* lime at low opacity */
color: #D0F255;
border-radius: 6px;
padding: 2px 8px;
font-size: 12px;
font-weight: 600;
```

#### Animation Tokens
```css
--ease-default: cubic-bezier(0.22, 0.61, 0.36, 1);  /* Harness signature */
--ease-bounce:  cubic-bezier(0.4, 0, 0.2, 1);        /* Pine Labs standard */
--duration-fast:   0.15s;
--duration-normal: 0.3s;
--duration-slow:   0.65s;
```
