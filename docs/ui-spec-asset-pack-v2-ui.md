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
- Room/map screens should use card grids with real course-card imagery and course-part PNGs instead of CSS-only mini art.
- Race-related screens should use the selected course visual as a framed preview/background accent and kart/effect images around the HUD.
- Buttons and utility controls should retain semantic HTML controls while using the provided menu-button and UI-frame PNGs as their visible skins.

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
| Menu button skins | `00_curated_named_png/logo_and_buttons/menu_button_004.png` through `menu_button_020.png`, `top_blank_ribbon.png` | copy to `app/web/assets/v2/buttons/` and use as button/shortcut backgrounds | exact | semantic button text remains the accessible name |
| Course parts | `00_curated_named_png/course_parts/*.png` | copy to `app/web/assets/v2/course-parts/` and attach per-course strips/stage layers | exact | course cards remain previews; parts make the UI feel assembled from the base kit |
| UI frames/controls | `00_curated_named_png/ui_frames_controls/*.png` | copy to `app/web/assets/v2/ui/` and use for icons, input frames, panel marks, and control skins | exact | text labels remain separate from decorative frames |
| Background themes | `00_curated_named_png/background_themes/*/{theme_badge,panorama,floor_tile,border_*}.png` | copy per theme to `app/web/assets/v2/themes/` and switch via selected course metadata | exact for available five themes | no dedicated Sky Spiral theme exists in the pack, so Sky keeps the course-card fallback |
| Icons | `00_curated_named_png/icons/*.png` | copy to `app/web/assets/v2/icons/` and use only for decorative player/icon accents | approximate | accessible names come from text or aria-labels |
| Kart sprites | `00_curated_named_png/kart_sprites/*_*.png` | copy selected player-color sprites and use in DOM plus canvas drawing when loaded | exact | canvas keeps CSS/vector fallback until images finish loading |
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
- "基本アセットにあるものは全部使う" は全ファイル配信ではなく、基本カテゴリを UI の主要部品として使う意味で扱う。無差別な全ファイル追加は初回表示重量を増やすため避ける。
- Background themes are available for Pastel, City, Candy, Ice, and Thunder Garden. Sky Spiral uses its course card and generic course-part fallback because a dedicated theme directory is not included.

## Acceptance Checklist

- [ ] v2 course-card PNGs are visible in menu/course-related screens.
- [ ] v2 kart/effect PNGs are visible in preview/result/race-adjacent UI.
- [ ] v2 menu-button PNGs are visible on primary/secondary action controls.
- [ ] v2 course-part PNGs are visible in course picker, map cards, and the menu stage.
- [ ] v2 background theme assets change with selected course where theme assets exist.
- [ ] 375px mobile and 1440px desktop render without incoherent overlap or horizontal page overflow.
- [ ] Existing game controls and menu navigation still work.
- [ ] Missing online/ranking data is shown as unavailable/empty, not fabricated live data.
