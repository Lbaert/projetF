# FIST - Projet Specification

**Date:** 2026-04-21
**Projet:** Fist Highlight Collective Voting Platform

---

## 1. Problem Statement

Créer une plateforme de vote collectif pour les membres du Discord "La Fistinière" afin de décider du contenu de leur vidéo highlight Hell Let Loose. Le système permet de proposer du contenu (clips, références, soundboard, musiques) et de voter pour déterminer quoi inclut dans le highlight.

---

## 2. Identity & Visual Direction

### Brand
- **Nom:** FIST

### Vibe
- WWII + Gaming + Troll + Secte elitiste
- "On est les meilleurs, les autres sont des clowns"
- Un peu toxic mais la vie c'est pas morose

### Color Palette
| Couleur | Hex | Usage |
|---------|-----|-------|
| Vert Military | #4B5320 | Primary background |
| Rouge Sang | #8B0000 | Accent, alerts |
| Noir Char | #1A1A1A | Text, dark sections |
| Or Elite | #C9A227 | Highlights, elite indicators |
| Gris Fer | #4A4A4A | Secondary elements |

### Typography
- Bold, militaire, old-school
- Hiérarchie via weight et taille

### Design Elements
- Références WWII dans le design
- Humour un peu toxique welcome
- Esthétique "commandement militaire"
- Badges/rangs pour les participants

---

## 3. Stack Technique

| Composant | Technology |
|-----------|------------|
| Frontend | Next.js (React) |
| Database | Supabase (PostgreSQL) |
| Auth | Discord OAuth |
| File Storage | Supabase Storage (MP3) |

---

## 4. Roles & Permissions

### Discord Role IDs
| Role | Discord Role ID | Accès |
|------|-----------------|-------|
| Fist | 1459634951891980451 | Lecture seule |
| Singe | 809815744577536050 | Lecture seule |
| Primate | 1453063817603846277 | Upload + Vote |
| Lycanthrope | 1413621899044327434 | Upload + Vote |
| Admin | 770068277044707335 | Tout + Suppression tout |

### Permission Matrix
| Action | Visiteur | Fist/Singe | Primate/Lycanthrope | Admin |
|--------|----------|------------|----------------------|-------|
| Voir page publique | ✅ | ✅ | ✅ | ✅ |
| Voir feed complet | ❌ | ✅ | ✅ | ✅ |
| Uploader contenu | ❌ | ❌ | ✅ | ✅ |
| Voter (like/dislike) | ❌ | ❌ | ✅ | ✅ |
| Supprimer son post | ❌ | ❌ | ✅ (le sien) | ✅ |
| Supprimer n'importe quel post | ❌ | ❌ | ❌ | ✅ |
| Voir Dashboard | ❌ | ❌ | ✅ | ✅ |

---

## 5. Data Model

### Content Types
| Type | Format | Stockage |
|------|--------|----------|
| Clips | Lien YouTube | URL |
| Musiques | Lien YouTube | URL |
| Références | Texte | Database |
| Soundboard | Fichier MP3 | Supabase Storage |

### Database Tables

#### users
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| discord_id | VARCHAR | Discord user ID |
| username | VARCHAR | Discord username |
| avatar | VARCHAR | Discord avatar URL |
| role | ENUM | visitor, member, admin |
| created_at | TIMESTAMP | Join date |

#### posts
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| type | ENUM | clip, music, reference, soundboard |
| content | TEXT | URL or text content |
| file_path | VARCHAR | For MP3 uploads |
| created_at | TIMESTAMP | Post date |
| updated_at | TIMESTAMP | Last update |

#### votes
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| post_id | UUID | FK to posts |
| user_id | UUID | FK to users |
| value | INTEGER | 1 (like) or -1 (dislike) |
| created_at | TIMESTAMP | Vote date |
| UNIQUE | | (post_id, user_id) |

---

## 6. Pages & Features

### Page 1: Feed Principal
**URL:** `/feed`

**Fonctionnalités:**
- Liste de tous les posts (filtrable)
- Filtres par type: Clips / Références / Soundboard / Musiques
- Tri par score (likes - dislikes)
- Affichage: auteur (avatar + pseudo), type, contenu, score, boutons vote
- Formulaire d'upload (pour primate/lycanthrope+)

**Pour les uploads:**
| Type | Input |
|------|-------|
| Clips | Lien YouTube |
| Musiques | Lien YouTube |
| Références | Texte libre |
| Soundboard | Upload fichier MP3 |

### Page 2: Mon Compte
**URL:** `/account`

**Fonctionnalités:**
- Liste de mes posts
- Stats personnelles (nb posts, score total)
- Actions: supprimer ses posts

### Page 3: Dashboard
**URL:** `/dashboard`

**Visible pour:** Primate/Lycanthrope + Admin

**Fonctionnalités:**
- Stats globales (total posts, participants, votes)
- Classement participants (top contributeurs)
- Répartition par type de contenu
- Actions de modération (suppression posts) - Admin only

### Page 4: Page Publique
**URL:** `/` (homepage sans auth)

**Fonctionnalités:**
- Consultation sans login
- Voir les contenus voted
- Pas de vote ni upload

---

## 7. Dashboard Stats

### Stats Globales
- Total posts par type
- Nombre de participants actifs
- Score moyen par type
- Ratio like/dislike global
- Top 10 contenus
- Historique d'activité (posts/jour)

### Stats Participants
- Nombre de posts par utilisateur
- Score total par utilisateur
- Nombre de votes par utilisateur
- Classement

---

## 8. Security Considerations

### Authentification
- Discord OAuth pour tous les utilisateurs
- Vérification du rôle Discord à chaque requête
- Session gérée par Supabase Auth

### Authorization
- Middleware vérifie le rôle avant chaque action
- Règles RLS (Row Level Security) Supabase
- Admin only routes protégées

### Validation
- URLs YouTube validées
- Fichiers MP3 limités à 10MB
- Content sanitization

---

## 9. Out of Scope (V1)

- Notifications email/push
- Comments sur les posts
- Messagerie interne
- Intégration autres plateformes (Twitter, etc.)
- Application mobile
- Système de reports
- Modération avancée (warnings, bans)

---

## 10. Success Criteria

1. ✅ Utilisateurs peuvent se connecter via Discord
2. ✅ Seuls primate/lycanthrope peuvent uploader et voter
3. ✅ Votes sont trackés (une fois, changeable)
4. ✅ Contenu trié par score
5. ✅ Dashboard avec stats pertinentes
6. ✅ Page publique accessible sans login
7. ✅ Admin peut supprimer tout contenu
8. ✅ Design aligné avec l'identité Fist

---

## 11. Next Steps

Passer à la phase **Writing Plans** pour créer l'implémentation détaillée.
