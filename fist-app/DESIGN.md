# Design System: FIST x MARATHON - Vote Terminal
**Project ID:** fist-vote-terminal
**Platform:** Desktop First (optimisé pour 1920x1080+, responsive vers tablet/mobile)

---

## Concept & Vision

**FIST** est la plateforme de vote de la communauté **La Fistinière** - un groupe de joueurs Hell Let Loose qui sélectionnent collectivement le contenu pour leur highlight vidéo.

### Inspiration: Marathon (Bungie 2026) + Terminal Militaire

L'esthétique **"VOTE_TERMINAL"** combine:
- L'univers sci-fi extraction shooter de Marathon (Bungie 2026)
- Le style terminal/militaire avec données techniques
- Les interfaces de jeu vidéo avec HUD minimaliste
- La typographie Space Grotesk bold et uppercase
- Le vert lime (#bbf600) comme accent principal

### Le Concept en une phrase
> Un terminal de vote elitiste pour la communauté Fist, inspiré par Marathon avec une interface terminal/militaire moderne.

### Structure du Terminal
- **FRONTLINE** - Le feed principal avec les posts
- **TERMINAL** - Formulaire de soumission
- **WAR ROOM** - Dashboard admin
- **PROFILE** - Compte utilisateur

### L'Identité FIST
- **Operator:** Nom d'utilisateur style "OPERATOR_01", "Lycanthrope_Class"
- **Rôles:** Fist/Singe (lecture), Primate/Lycanthrope (upload+vote), Admin (tout)
- **Esthétique:** Terminal de vote avec données tactiques

### Les 4 Types de Contenu
| Type | Badge | Format |
|------|-------|--------|
| Clip | 🎬 | Lien YouTube |
| Musique | 🎵 | Lien YouTube |
| Référence | 💬 | Texte (private joke) |
| Soundboard | 🔊 | Fichier MP3 |

### Le Système de Vote
- **Display:** Badge "XX.X% APPROVAL" + boutons 👍/👎
- **Tri:** Par pourcentage (best content first)
- **Style:** Votes en grille compacte

---

## 1. Visual Theme & Atmosphere

### VOTE_TERMINAL Aesthetic

L'interface évoque un **terminal de vote tactique** avec:
- Fond noir profond (#131313)
- Accent vert lime (#bbf600) pour les éléments actifs
- Typographie Space Grotesk bold et technique
- Labels uppercase avec letter-spacing
- Données de形式的 et stats style "TERMINAL"
- Sharp corners (pas de border-radius)

**Keywords pour Stitch:**
- Dark terminal interface
- Marathon Bungie game aesthetic
- Military tactical data display
- Lime green phosphor accent
- Space Grotesk typography
- Operator/Crew identity system

---

## 2. Color Palette & Roles

### Foundation
- **Background:** #131313 (noir profond terminal)
- **Surface Container Low:** #1b1b1b (panels)
- **Surface Container Lowest:** #0e0e0e (cards)
- **Border Zinc-800:** #27272a (borders subtiles)

### Primary (Lime Phosphor)
- **Primary Container:** #bbf600 (vert lime vif)
- **Primary Fixed:** #bbf600 (même couleur, usage différent)
- **Primary Fixed Dim:** #a4d700 (vert légèrement plus sombre)
- **Surface Tint:** #a4d700 (indicateurs)

### Text
- **On Background/Surface:** #e2e2e2 (blanc cassé)
- **On Surface Variant:** #c3caad (texte secondaire)
- **Zinc-400/500:** #a1a1aa / #71717a (muted text)

### Status
- **Success/Lime:** #bbf600 (approuvé, actif)
- **Error:** #ffb4ab (rejeté, danger)
- **Warning:** #fbbf24 (en attente)

---

## 3. Typography Rules

### Font Stack
- **Headlines:** `"Space Grotesk"` - Bold, uppercase, tracking tight
- **Body:** `"Inter"` - Regular, lisible
- **Labels/Mono:** `"Space Grotesk"` - Uppercase, letter-spacing 0.15em

### Hierarchy
| Element | Font | Size | Weight | Transform |
|---------|------|------|--------|-----------|
| Page Title | Space Grotesk | 48px | 700 | uppercase |
| Section Header | Space Grotesk | 24px | 600 | uppercase |
| Card Title | Space Grotesk | 18px | 700 | uppercase |
| Labels | Space Grotesk | 12px | 700 | uppercase, tracking 0.15em |
| Body | Inter | 16px | 400 | normal |
| Mono/Data | Space Grotesk | 14px | 500 | normal |

### Spacing
- Base unit: 4px
- Card padding: 16px
- Section gap: 24px
- Grid gap: 16px

---

## 4. Component Stylings

### Buttons

**Primary (Lime)**
```
Background: #bbf600
Text: #000000
Hover: brightness 110%
Corners: 0px (sharp)
Font: Space Grotesk uppercase
```

**Secondary (Outline)**
```
Background: transparent
Border: 1px solid #27272a
Text: #e2e2e2
Hover: border #bbf600, text #bbf600
Corners: 0px
```

**Vote Buttons (Grid)**
```
Style: 2-column grid within card
Background: black
Border: 1px solid #27272a
Like hover: #bbf600 background
Dislike hover: #dc2626 background
Text: counts in Space Grotesk
```

### Cards

**Post Card (Frontline)**
```
Background: #000000
Border: 1px solid #27272a
Hover: border #bbf600
Corner: 0px
Top-right badge: "XX.X% APPROVAL" in lime
```

**Stat Card (Dashboard)**
```
Background: #1b1b1b
Border: 1px solid #27272a
Label: uppercase zinc-500
Value: large lime text
```

### Navigation

**TopBar**
```
Background: #000000
Border-bottom: 2px solid rgba(187,246,0,0.3)
Logo: "VOTE_TERMINAL" in lime, italic, bold
Search: dark input with lime border on focus
```

**SideNav**
```
Background: #000000
Border-right: 2px solid #27272a
Menu items: uppercase, zinc-400
Active: lime background, black text, border-l-4 white
```

**BottomNav (Mobile)**
```
Background: black/95 with blur
Border-top: 2px solid #bbf600
Icons + labels
Active: lime, inactive: zinc-500
```

### Inputs

**Terminal Input**
```
Background: #131313
Border: 1px solid #27272a
Focus: border #bbf600
Text: #e2e2e2
Placeholder: #52525b
Font: Space Grotesk uppercase
```

### Badges

**Approval Badge**
```
Position: top-right of card
Background: lime (#bbf600)
Text: black, bold
Example: "98.2% APPROVAL"
```

**Content Type**
```
Small pill with emoji + text
Border: 1px solid current color
Uppercase
```

---

## 5. Layout Principles

### Desktop First

**Structure:**
```
┌─────────────────────────────────────┐
│ TOPBAR (VOTE_TERMINAL, search, user)  │
├──────────┬──────────────────────────┤
│ SIDENAV │ MAIN CONTENT            │
│          │                         │
│ FRONTLINE│ [Post Cards Grid]         │
│ TERMINAL │                         │
│ WAR ROOM │                         │
│ PROFILE  │                         │
├──────────┴──────────────────────┤
│ BOTTOM NAV (mobile only)            │
└────────────────────────────────────┘
```

**Grid:**
- Posts: 3 columns on desktop
- Stats: 4 columns on desktop
- Max-width: 6xl (1152px)

### Pages

1. **FRONTLINE (Feed):** Grid of post cards
2. **TERMINAL (Submit):** Form with content type selection
3. **WAR ROOM (Admin):** Table with submissions
4. **PROFILE (Account):** User stats and history

---

## 6. Stitch Generation Guide

### Atmosphere Keywords
- "Dark terminal voting interface"
- "Marathon Bungie aesthetic"
- "Lime green phosphor accents"
- "Military tactical data display"
- "Space Grotesk typography"
- "Operator identity system"

### Color References
| Role | Hex | Usage |
|------|-----|-------|
| Lime Primary | #bbf600 | Active elements, approval badges |
| Background | #131313 | Page background |
| Card BG | #000000 | Post cards |
| Surface | #1b1b1b | Elevated panels |
| Border | #27272a | Subtle borders |
| Text | #e2e2e2 | Primary text |
| Muted | #71717a | Secondary text |

### Typography Keywords
- "Space Grotesk for all headings"
- "Uppercase labels with letter-spacing"
- "Bold italic for logo"
- "Monospace feel for data"

### Component Prompts for Stitch

**Homepage/Frontline Feed:**
```
A dark terminal-style feed for a gaming community.
Black background (#131313) with lime green (#bbf600) accents.
Post cards with black background and subtle borders.
Top-right approval badge in lime green.
Vote buttons in 2-column grid at bottom of each card.
Operator usernames and timestamps.
Space Grotesk typography, uppercase labels.
```

**Post Card:**
```
A post card with dark terminal aesthetic.
Top badge showing approval percentage in lime green.
Content area with image/video placeholder.
User avatar and username.
Vote section: [👍 count] [👎 count] grid.
Hover: lime green border.
Sharp corners, no border-radius.
```

**Dashboard/War Room:**
```
A tactical admin dashboard with terminal interface.
Dark background with lime accents.
Table layout for submissions.
Status badges for each entry.
Space Grotesk typography.
```

**Submit Form/Terminal:**
```
A submission form with terminal styling.
Dark inputs with lime focus state.
Content type selector with icons.
Large submit button in lime.
Warning text in muted gray.
```

---

## 7. Voting Display Specification

**Format:** Badge "XX.X% APPROVAL" + grid buttons

**Example:** "98.2% APPROVAL" + [👍 14,204] [👎 201]

**Sorting:** Posts sorted by percentage (highest first)

---

## 8. Design Tokens

```javascript
// Tailwind Config
colors: {
  'primary-container': '#bbf600',
  'primary-fixed': '#bbf600',
  'background': '#131313',
  'surface-container-low': '#1b1b1b',
  'surface-container-lowest': '#0e0e0e',
  'border-zinc-800': '#27272a',
  'on-background': '#e2e2e2',
  'on-surface': '#e2e2e2',
}

fontFamily: {
  headline: ['Space Grotesk'],
  body: ['Inter'],
  label: ['Space Grotesk'],
}

textTransform: 'uppercase'
letterSpacing: '0.15em' // for labels
```

---

## 9. Content Examples

### Post Card Content
- Title: "NEON_DRIFT_04_FINAL" (uppercase)
- Badge: "98.2% APPROVAL"
- Votes: 14,204 👍 / 201 👎
- Meta: "SUBMITTED BY: USER_XERO / 2H AGO"

### Operator Identity
- Username: "OPERATOR_01"
- Class: "LYCANTHROPE_CLASS"
- Status: "SYSTEM: ACTIVE"
- Stats: "SUBMISSIONS: 422 / VOTES_CAST: 1.8k"

### Navigation Labels
- "FRONTLINE" - Feed
- "TERMINAL" - Submit
- "WAR ROOM" - Admin
- "PROFILE" - Account
- "INITIATE SUBMISSION" - CTA
