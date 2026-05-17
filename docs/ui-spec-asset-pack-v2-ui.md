# UI Spec: canonical reference artboard UI

## Source References

- Canonical 1672x941 reference screenshots copied from workspace:
  - `app/web/public/assets/reference/menu.png`
  - `app/web/public/assets/reference/room.png`
  - `app/web/public/assets/reference/map.png`
  - `app/web/public/assets/reference/ready.png`
  - `app/web/public/assets/reference/game.png`
  - `app/web/public/assets/reference/result.png`
- Course board sources:
  - `app/web/public/assets/v2/course-boards/course_01_pastel_planet_board.png`
  - `app/web/public/assets/v2/course-boards/course_02_pikapika_city_board.png`
  - `app/web/public/assets/v2/course-boards/course_03_candy_loop_board.png`
  - `app/web/public/assets/v2/course-boards/course_04_thunder_garden_board.png`
  - `app/web/public/assets/v2/course-boards/course_05_ice_cube_board.png`
  - `app/web/public/assets/v2/course-boards/course_06_sky_spiral_board.png`
- Asset pack: `.workspace/biribiri_racers_asset_pack_v2.zip`
- Existing screen: `app/web/index.html`
- Existing behavior: `app/web/src/`
- Existing styles: `app/web/styles.css`

## Screen

- Route: Vite single-page app at `app/web/index.html`
- Target screens: menu, room/course selection, map/course list, ready, game, result

## Layout Structure

### Desktop

- All primary screens are implemented as a 1672x941 reference artboard.
- The artboard is centered in the viewport with `width: min(100vw, calc(100svh * 1672 / 941))` and `aspect-ratio: 1672 / 941`.
- Screen regions, HUDs, button placement, course preview placement, and panel proportions should be derived from the canonical screenshot coordinates, not from fluid grid recomposition.
- Menu, room, map, ready, game, and result should be implemented as screen-specific compositions on top of the same artboard primitive.
- Buttons and utility controls retain semantic HTML controls while using baked PNG skins as the visible surface when the reference includes baked labels.
- The race canvas should draw a completed course-board image first when `Course.boardAsset` is available. Generated chip tracks are a fallback and collision source, not the target visual for screenshot matching.

### Mobile

- The desktop reference remains the canonical layout.
- Mobile support may scale or crop the artboard in a controlled way, but must not introduce unrelated sections or fake data.
- Primary controls still need accessible names and keyboard/touch operation.
- Exact mobile visual parity is lower priority than desktop 1672x941 parity unless separate mobile reference screenshots are supplied.

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
| Course cards | `00_curated_named_png/course_cards/*.png` | copy selected PNGs to `app/web/public/assets/v2/course-cards/` and render with `img`/background | exact | six course cards available |
| Effects/badges | `00_curated_named_png/effects_badges/*.png` | copy selected badges and decorative effects | exact | boost/confetti/spark/medal |
| Logo and result banners | `00_curated_named_png/logo_and_buttons/main_logo.png`, `start_badge.png`, `goal_badge.png`, `winner_banner.png`, `new_badge.png` | copy selected PNGs and render in menu/result/status UI | exact | replaces text-only logo/stage badges while preserving accessible labels |
| Menu button skins | `00_curated_named_png/logo_and_buttons/menu_button_004.png` through `menu_button_020.png`, `top_blank_ribbon.png` | copy to `app/web/public/assets/v2/buttons/` and use as button/shortcut backgrounds | exact | semantic button text remains the accessible name |
| Course parts | `00_curated_named_png/course_parts/*.png` | copy to `app/web/public/assets/v2/course-parts/` and attach per-course strips/stage layers | exact | course cards remain previews; parts make the UI feel assembled from the base kit |
| UI frames/controls | `00_curated_named_png/ui_frames_controls/*.png` | copy to `app/web/public/assets/v2/ui/` and use for icons, input frames, panel marks, and control skins | exact | text labels remain separate from decorative frames |
| Background themes | `00_curated_named_png/background_themes/*/{theme_badge,panorama,floor_tile,border_*}.png` | copy per theme to `app/web/public/assets/v2/themes/` and switch via selected course metadata | exact for available five themes | no dedicated Sky Spiral theme exists in the pack, so Sky keeps the course-card fallback |
| Icons | `00_curated_named_png/icons/*.png` | copy to `app/web/public/assets/v2/icons/` and use only for decorative player/icon accents | approximate | accessible names come from text or aria-labels |
| Kart sprites | `00_curated_named_png/kart_sprites/*_*.png` | copy selected player-color sprites and use in DOM plus canvas drawing when loaded | exact | canvas keeps CSS/vector fallback until images finish loading |
| Course boards 01-05 | `app/web/public/assets/v2/course-boards/course_01_pastel_planet_board.png` through `course_05_ice_cube_board.png` | draw as the race canvas background through `Course.boardAsset` | close | 02-05 are normalized PNG derivatives of existing completed course images; collision still uses `chipTrack.ts` until coordinates are recalibrated |
| Sky Spiral course board | `app/web/public/assets/v2/course-boards/course_06_sky_spiral_board.png` | draw as the race canvas background through `Course.boardAsset` | approximate | cropped from the v2 course card because no standalone Sky board source is present in the repository |
| Existing chip track | `app/web/src/game/chips/*` generated path | retain as fallback and collision source | existing | not the target visual when `boardAsset` is loaded |

### Asset Text And Scale Rules

- Course-card PNGs are complete visual cards with course number, name, stars, copy, laps, and expected time already baked in. Render them as a single `<img>` and do not duplicate those labels as visible HTML inside the same card.
- HTML course metadata remains the source for accessibility names and for adjacent detail panels, not for overlaying text on top of baked-in PNG labels.
- Baked-label button PNGs should provide the visible label. The semantic button text remains in the DOM as a screen-reader-only accessible name.
- Card and decoration PNGs must keep their intrinsic ratio via `height: auto`, `object-fit: contain`, or `background-size: contain`; do not use `background-size: cover` for complete cards.
- Selection and status states should use outer rings, shadows, or separate text below the card, not text placed over the PNG.

## Accessibility Expectations

- All meaningful images have concise Japanese `alt`.
- Decorative sprites/effects use empty `alt` or `aria-hidden`.
- Buttons retain accessible names.
- Focus indicator remains visible over saturated UI.
- Mobile/touch targets remain at least 44px where practical.

## Unknowns And Assumptions

- The six `app/web/public/assets/reference/*.png` files are treated as canonical for desktop visual hierarchy.
- Course card images are presentation previews; race collision logic currently remains the existing chip path.
- `Course.boardAsset` is now expected for all six courses. Course 06 is an approximate derivative because the repository does not contain a standalone board source.
- `course_*.png` board images do not yet have matching `chipTrack.ts` collision coordinates, so road visuals and collision may differ until follow-up calibration.
- Online features remain unavailable states, not fake live data.
- "基本アセットにあるものは全部使う" は全ファイル配信ではなく、基本カテゴリを UI の主要部品として使う意味で扱う。無差別な全ファイル追加は初回表示重量を増やすため避ける。
- Background themes are available for Pastel, City, Candy, Ice, and Thunder Garden. Sky Spiral uses its course card and generic course-part fallback because a dedicated theme directory is not included.

## Acceptance Checklist

- [ ] v2 course-card PNGs are visible in menu/course-related screens.
- [ ] v2 course-card PNGs are rendered without cover-cropping or visible duplicate HTML labels.
- [ ] v2 kart/effect PNGs are visible in preview/result/race-adjacent UI.
- [ ] v2 menu-button PNGs are visible on primary/secondary action controls.
- [ ] Buttons that use baked-label PNGs retain accessible names while hiding duplicate visible text/icons.
- [ ] v2 course-part PNGs are visible in course picker, map cards, and the menu stage.
- [ ] v2 background theme assets change with selected course where theme assets exist.
- [ ] 375px mobile and 1440px desktop render without incoherent overlap or horizontal page overflow.
- [ ] Existing game controls and menu navigation still work.
- [ ] Missing online/ranking data is shown as unavailable/empty, not fabricated live data.
- [ ] 1672x941 visual regression checks exist for menu, room, map, ready, game, and result.
- [ ] `Course.boardAsset` is present for all six courses, preloaded, and used as the race canvas background before car sprites are drawn.
- [ ] `chipTrack.ts` coordinates are recalibrated or explicitly marked as an open mismatch for each board-backed course.
