# UI Spec: asset pack v2 visual refresh

## Source References

- `.workspace/biribiri_racers_asset_pack_v2.zip`
- `.workspace/ChatGPT Image 2026年5月16日 14_30_*.png`
- Existing screen: `app/web/index.html`
- Existing behavior: `app/web/app.js`
- Existing styles: `app/web/styles.css`

## Screen

- Route: static single-page app at `app/web/index.html`
- Target screens: menu, room/course selection, map/course list, ready, game, result

## Layout Structure

### Desktop

- Menu keeps a two-column composition: left command/navigation area and right visual preview area.
- The right side should show large course imagery, selected kart sprites, badges, and recommended course cards.
- Room/map screens should use card grids with real course-card imagery instead of CSS-only mini art.
- Race-related screens should use the selected course visual as a framed preview/background accent and kart/effect images around the HUD.

### Mobile

- Screens collapse to a single column.
- Primary actions remain 44px or larger.
- Image cards keep fixed aspect ratios so labels and buttons do not shift layout.
- Decorative badges may shrink or hide when space is constrained.

## Component Inventory

- Main menu hero and action buttons
- Player profile card
- Featured course stage
- Recommended course cards
- Room settings panel
- Course picker and course detail
- Map course grid
- Ready preview canvas and race canvas
- HUD panels and result summary

## Visual Tokens

- Overall direction: bright arcade/kids racing UI using saturated cyan, pink, yellow, green, and white.
- Corners: existing rounded playful UI is retained, but image cards use stable aspect ratios.
- Shadows: chunky button shadows and soft blue/pink glows.
- Typography: existing Japanese rounded/system stack, no viewport-width font scaling.
- Background: light racing/pastel pattern; avoid one-note blue-only dominance by adding pink/yellow/green asset accents.

## Content Inventory

- Existing Japanese labels remain.
- Course data remains the source for course names, tags, laps, and expected time.
- Missing real record data continues to render as honest empty/not-yet state.

## Interaction And State Inventory

- Existing button actions and keyboard/game controls remain.
- Course selection updates detail, cards, ready screen, and race display.
- Online join/friend/ranking functionality remains explicitly unavailable where not implemented.

## Asset Mapping

| Reference asset | Source path | Method | Exactness | Notes |
|---|---|---|---|---|
| Course cards | `00_curated_named_png/course_cards/*.png` | copy selected PNGs to `app/web/assets/v2/course-cards/` and render with `img`/background | exact | six course cards available |
| Effects/badges | `00_curated_named_png/effects_badges/*.png` | copy selected badges and decorative effects | exact | boost/confetti/spark/medal |
| Logo and result banners | `00_curated_named_png/logo_and_buttons/main_logo.png`, `start_badge.png`, `goal_badge.png`, `winner_banner.png`, `new_badge.png` | copy selected PNGs and render in menu/result/status UI | exact | replaces text-only logo/stage badges while preserving accessible labels |
| Kart sprites | `00_curated_named_png/kart_sprites/*_*.png` | copy selected player-color sprites and use in DOM plus canvas drawing when loaded | exact | canvas keeps CSS/vector fallback until images finish loading |
| Icon-like UI marks | `00_curated_named_png/icons/*.png` | use only if semantic purpose is clear | approximate | prefer text labels for accessible names |
| Existing canvas track | `app/web/app.js` drawn path | retain as gameplay surface | existing | v2 course images are presentation assets, not collision maps |

## Accessibility Expectations

- All meaningful images have concise Japanese `alt`.
- Decorative sprites/effects use empty `alt` or `aria-hidden`.
- Buttons retain accessible names.
- Focus indicator remains visible over saturated UI.
- Mobile/touch targets remain at least 44px where practical.

## Unknowns And Assumptions

- The exact screenshot intended by "画像のようなUI" is not attached in the chat; this implementation treats the provided workspace reference images and v2 asset pack as the source of truth.
- Course card images are presentation previews; race collision logic remains the existing canvas path.
- Online features remain unavailable states, not fake live data.

## Acceptance Checklist

- [ ] v2 course-card PNGs are visible in menu/course-related screens.
- [ ] v2 kart/effect PNGs are visible in preview/result/race-adjacent UI.
- [ ] 375px mobile and 1440px desktop render without incoherent overlap or horizontal page overflow.
- [ ] Existing game controls and menu navigation still work.
- [ ] Missing online/ranking data is shown as unavailable/empty, not fabricated live data.
