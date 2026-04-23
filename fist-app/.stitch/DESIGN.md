# A.U.E.R. Design System

## Overview
Dark sci-fi landing page inspired by Marathon (Bungie). Military-tactical aesthetic with industrial elements, hazard motifs, and a cold cyber-warfare vibe. The design evokes a classified military operation aboard a derelict space station.

---

## Design Tokens

### Color Palette
| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Background | Void Black | `#0a0a0a` | Page background |
| Surface | Gunmetal | `#1a1a1a` | Cards, panels |
| Surface Elevated | Dark Metal | `#2a2a2a` | Elevated elements |
| Border | Charcoal | `#333333` | Dividers, borders |
| Text Primary | Off-White | `#e5e2e1` | Body text |
| Text Muted | Slate | `#71717a` | Secondary text |
| Accent Primary | Lime Signal | `#C2FE0C` | Primary actions, highlights, active states |
| Accent Secondary | Hazard Orange | `#fe6b00` | Secondary accent, warnings |
| Accent Cyan | Electric Cyan | `#3cd7ff` | Tertiary highlights |

### Typography
- **Display Font**: Space Grotesk (weights: 300, 400, 500, 600, 700, 900)
  - Headlines, navigation, buttons, uppercase labels
- **Body Font**: Inter (weights: 300, 400, 600, 700)
  - Body text, descriptions
- **Monospace**: System monospace for technical labels

### Type Scale
| Style | Font | Size | Line Height | Letter Spacing | Weight |
|-------|------|------|-------------|----------------|--------|
| display-xl | Space Grotesk | 72px | 1.1 | -0.04em | 700 |
| headline-lg | Space Grotesk | 40px | 1.2 | -0.02em | 600 |
| headline-md | Space Grotesk | 24px | 1.3 | - | 600 |
| body-lg | Inter | 18px | 1.6 | - | 400 |
| body-md | Inter | 16px | 1.5 | - | 400 |
| label-sm | Space Grotesk | 12px | 1 | 0.1em | 600 |

### Border Radius
- Default: `0px` (sharp edges throughout)
- Full: `9999px` (pill buttons)

### Shadows
- **Glass Panel**: `rgba(26, 26, 26, 0.8)` background, 12px backdrop blur, 1px charcoal border
- **Nav Shadow**: `0 0 20px rgba(194, 254, 12, 0.05)`
- **Button Glow (hover)**: `0 0 20px rgba(254, 107, 0, 0.6)`
- **Card Hover**: `0 10px 30px -10px rgba(254, 107, 0, 0.3)`

---

## Component Library

### Navigation Bar
- Fixed position, full-width
- Semi-transparent dark glass background with backdrop blur
- Logo: "A.U.E.R." in lime (#C2FE0C), Space Grotesk, font-black
- Nav links: uppercase, tracking-widest, 12px, muted by default, white on hover
- Active link: lime color with bottom border
- CTA Button: "DEPLOY" in hazard orange, pill shape
- Scroll behavior: background becomes more opaque

### Hero Section
- Full viewport height
- Background: cinematic sci-fi image with gradient overlay (transparent → dark → darker)
- Staggered fade-up animation on load (0.2s, 0.4s, 0.6s, 0.8s delays)
- Status badge: bordered pill with orange accent
- Headline: display-xl, uppercase, white with orange accent on keywords
- Subheadline: body-lg, muted color, max-width 2xl
- Two CTAs: primary (lime bg, black text) and secondary (transparent, white border)
- Scroll indicator: centered at bottom with bounce animation

### Stats Bar
- Dark background with top/bottom borders
- 4-column grid on desktop, 2-column on mobile
- Labels: muted, uppercase, tracking-widest
- Values: headline-md, white or accent color
- Tabular nums for numbers

### Feature Cards (Bento Grid)
- Glass panel effect with backdrop blur
- Icon: material symbols, filled, 40px, orange accent
- Title: headline-md, uppercase
- Description: body-md, muted
- Corner technical label (monospace, low opacity, shows on hover)
- Hover: lift up 8px, orange border glow, shadow spread

### Showcase Sections
- Alternating left/right layouts
- Image with offset border frame
- Live indicator badge (pulsing green dot)
- Threat level badges
- Checkmark lists with lime icons
- Stat grids with glass panels

### News Cards
- Horizontal scrollable row
- Thumbnail with hover scale effect
- Date tag in lime monospace
- Title: uppercase, hover changes to orange
- Hover overlay: orange tint

### Footer
- Dark background, top border
- 4-column grid: logo/tagline, nav links, system status, social icons
- Social icons: glass panel buttons with hover lime border
- Bottom bar: copyright and system links in tiny uppercase

---

## Animation System

### Keyframes
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0) translateX(-50%); }
  50% { transform: translateY(10px) translateX(-50%); }
}
```

### Animation Classes
| Class | Behavior |
|-------|----------|
| `.animate-fade-up` | Opacity 0→1, translateY 30→0, 0.8s cubic-bezier |
| `.bounce-indicator` | Infinite bounce, 2s duration |
| `.reveal-on-scroll` | Initial: opacity 0, translateY 40px; Active: opacity 1, translateY 0 |
| `.btn-hazard-hover` | Scale 1.05 + orange glow on hover |
| `.feature-card-hover` | translateY -8px + orange border + shadow on hover |

### Transitions
- Default: `all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)` (glass panels)
- Hover effects: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (buttons)
- Image scale: `transform 0.7s` (news cards)

---

## Atmosphere Keywords
Dark, military, sci-fi, industrial, tactical, classified, cyber-warfare, derelict space station, hazmat, surveillance, extraction shooter

## Reference Sites
- Marathon (marathonthegame.com) - overall vibe and structure
- Destiny 2 - weapon UI elements
- Halo series - military-industrial aesthetic
