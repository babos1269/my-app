---
name: Gestion de Bluch Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#424656'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737687'
  outline-variant: '#c2c6d9'
  surface-tint: '#0053da'
  primary: '#004cca'
  on-primary: '#ffffff'
  primary-container: '#0062ff'
  on-primary-container: '#f3f3ff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#54585a'
  on-tertiary: '#ffffff'
  tertiary-container: '#6d7072'
  on-tertiary-container: '#f3f5f7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 20px
  gutter: 16px
---

## Style et Image de Marque

Ce système de design repose sur les principes du minimalisme fonctionnel et de la clarté opérationnelle. Inspiré par l'esthétique de précision des outils SaaS modernes, il privilégie l'utilisabilité par-dessus l'ornementation. L'objectif est de réduire la charge cognitive pour les utilisateurs B2B, permettant une gestion rapide et efficace des flux de travail.

L'identité visuelle est définie par une utilisation généreuse de l'espace négatif (« white space »), une typographie rigoureuse et une absence totale d'éléments superflus comme les dégradés complexes ou les ombres portées lourdes. L'interface doit paraître légère, aérée et extrêmement réactive.

## Couleurs

La palette est délibérément restreinte pour renforcer la concentration. 

- **Primaire (#0062FF)** : Utilisé exclusivement pour les actions principales, les états actifs et les indicateurs de progression. C'est l'ancre visuelle de l'interface.
- **Secondaire (#64748B)** : Un gris ardoise doux utilisé pour le texte secondaire et les icônes de navigation non actives.
- **Tertiaire (#F8FAFC)** : Une nuance de gris très clair destinée aux arrière-plans de sections et aux surfaces de cartes subtiles pour séparer le contenu sans utiliser de bordures lourdes.
- **Neutre (#0F172A)** : Un bleu-noir profond pour la typographie principale, assurant un contraste maximal et une lisibilité parfaite.

Le fond principal doit rester blanc pur (#FFFFFF) pour maximiser la sensation d'espace.

## Typographie

Le système utilise **Inter** pour l'ensemble de l'interface. C'est une police hautement lisible, optimisée pour les écrans mobiles et les interfaces denses en données.

L'accent est mis sur la hiérarchie verticale :
- Les titres utilisent un poids "Bold" ou "SemiBold" avec un espacement de lettres légèrement réduit pour un aspect plus compact et professionnel.
- Le corps de texte privilégie le poids "Regular" pour une lecture prolongée sans fatigue.
- Les étiquettes et petits textes utilisent un poids "Medium" pour maintenir la lisibilité malgré la taille réduite.

## Mise en page et Espacement

Le système repose sur une grille de base de **8px**. Tous les espacements, paddings et marges doivent être des multiples de cette unité.

Pour l'application mobile :
- **Marges latérales** : Un padding de sécurité de 20px est appliqué sur les bords gauche et droit de l'écran.
- **Sections** : Les groupes de contenus sont séparés par un espacement de 32px (xl) pour créer une respiration visuelle claire.
- **Listes** : Un espacement de 16px (md) entre les éléments de liste assure une distinction tactile suffisante pour les interactions au doigt.

## Élévation et Profondeur

Le système adopte une approche de profondeur "plate" (flat layers). La hiérarchie est créée par la couleur de fond plutôt que par l'ombre.

- **Surfaces de base** : Fond blanc (#FFFFFF).
- **Conteneurs** : Pour détacher un élément (comme une carte de résumé), utilisez une bordure très fine (1px) de couleur #E2E8F0 ou un fond gris très léger (#F8FAFC).
- **Ombres** : Elles sont utilisées avec parcimonie, uniquement pour les éléments flottants (modales, menus contextuels). Ces ombres doivent être extrêmement diffuses, avec une opacité très faible (5-10%) et sans décalage vertical agressif, simulant une lumière ambiante naturelle.

## Formes

Le langage des formes est modéré et moderne. Les angles ne sont ni brusques ni excessivement ronds.

- **Composants standard** : Les boutons, champs de saisie et cartes utilisent un rayon de courbure de 8px (0.5rem). 
- **Éléments interactifs larges** : Les conteneurs de grande taille peuvent monter jusqu'à 16px (1rem) pour adoucir l'impact visuel sur l'écran.
- **Éléments de sélection** : Les cases à cocher conservent un léger arrondi (4px) pour rester cohérentes avec le reste du système tout en affirmant leur fonction.

## Composants

### Boutons
- **Primaire** : Fond #0062FF, texte blanc, sans ombre. État "Pressed" légèrement plus sombre.
- **Secondaire** : Fond blanc, bordure 1px #E2E8F0, texte #0F172A.
- **Tertiaire (Ghost)** : Pas de fond ni de bordure, texte #0062FF. Utilisé pour les actions secondaires moins urgentes.

### Champs de saisie (Inputs)
Les champs doivent avoir une bordure de 1px #E2E8F0 et un fond blanc. Lors du focus, la bordure devient #0062FF. Le texte d'aide (placeholder) est en #94A3B8.

### Listes et Cellules
Les éléments de liste ne doivent pas être enfermés dans des boîtes individuelles. Utilisez des séparateurs horizontaux fins (1px) qui ne s'étendent pas jusqu'aux bords de l'écran (paddings latéraux respectés).

### Icônes
Utilisez des icônes filaires (outline) avec une épaisseur de trait constante (2px). Évitez absolument les icônes circulaires avec des fonds colorés ; l'icône doit être nue, en #64748B, ou en #0062FF si elle est interactive.

### Badges (Chips)
Pour les statuts, utilisez un fond très clair (ex: vert pâle pour "Validé") avec un texte de couleur saturée de la même teinte. Les coins sont totalement arrondis (pill-shaped).