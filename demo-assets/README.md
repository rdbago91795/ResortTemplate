# demo-assets

Source imagery for the fictional demo property, **Balai Amihan**. `pnpm seed` uploads whatever
it finds here; `pnpm seed:teardown` removes the uploaded objects and leaves this directory
alone.

**These files are not in the repository yet.** `pnpm seed` runs without them and reports each
one it skipped — everything else seeds normally. Add them and re-run to complete the demo.

## Why these are AI-generated and the real ones are not

Constitution IV: photography a guest uses to decide whether to book must be real. That rule is
about a *deployed* resort. This directory is the opposite case — a fictional property that does
not exist, used to demonstrate the template. Generating it is the only honest option; a real
photograph here would misrepresent a place no one can stay at.

When a real resort deploys this template, the owner replaces every one of these through the
admin. Nothing here should survive into a live site.

## What to produce

JPEG, sRGB, **2400px on the long edge**, quality ~80, under 5 MB (the bucket rejects anything
larger). Landscape unless noted.

The property: a small resort in General Luna, Siargao. Timber and woven bamboo, capiz-shell
ventanilla, coral-stone paths, palms. Overcast-bright or early-morning light — not saturated
postcard sun. The design system calls the palette petrol teal and capiz celadon; imagery should
sit beside that without fighting it.

| File | Subject |
|---|---|
| `hero-beach.jpg` | The reef break at first light from the shore. Wide, calm, room for text across the upper third |
| `pool-morning.jpg` | The pool before anyone is awake, palms reflected in still water |
| `dining-table.jpg` | A long table under an awning, set for breakfast, no people |
| `grounds-path.jpg` | A coral-stone path running between garden kubos |
| `room-kubo.jpg` | Inside a native kubo — woven bamboo ceiling, shutters open to palms, one queen bed |
| `room-capiz.jpg` | Capiz-shell ventanilla above a king bed, throwing a pale grid of light on the floor |
| `room-loft.jpg` | An upstairs loft open on two sides, king bed plus two singles under the eaves |
| `room-cabana.jpg` | A beachfront cabana deck, two steps down to sand |
| `room-bahay.jpg` | A two-bedroom house seen from the garden, long table under the awning |

### `payment-qr-placeholder.png`

PNG, square, 800×800.

**Must be visibly non-functional** (FR-076). A QR that scans to a real payment destination in a
demo is a way to accidentally take someone's money. Draw a QR-shaped placeholder — finder
squares in the three corners, plausible noise between them — that does not decode, and put
**PLACEHOLDER — NOT A REAL PAYMENT CODE** across it in plain text.

Verify it fails to scan with a phone before committing it.

## Where they go

- The nine JPEGs → `demo-assets` bucket, under `demo/`, and a `gallery_images` row each
- The QR → `payment-assets` bucket (**private, no read policy for any role**), under `demo/`,
  with `site_settings.payment_qr_path` pointing at it

Alt text is written in `supabase/seed/demo.ts` and travels with the row, not the file.
