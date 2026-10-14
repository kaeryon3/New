# Ninth Needle Tattoo

A static website for a fictional three-artist tattoo studio. Names, prices, address and contact details are placeholders.

## What's on the page

- **Hero** with a dagger-and-heart flash piece that inks itself over its purple thermal stencil on load
- **Live walk-in status** worked out from the visitor's local time (walk-ins Thu–Sat, 12–6 pm)
- **Flash sheet** of one-off designs; "Claim this design" pre-fills the booking form
- **Artist profiles** with style, go-to needle groupings and booking status
- **Price board and process** from consult to touch-up
- **Booking estimator**: size, style, placement and ink give a time and price range at $160/hr with an $80 minimum, and long pieces are split into sessions of up to 4 hours
- **Request summary** you can copy and email (the site has no backend, so nothing is sent automatically)
- **Aftercare timeline**, FAQ, hours and contact details

Light and dark themes follow the system setting. Animations respect `prefers-reduced-motion`.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page markup and content |
| `styles.css` | Design tokens, layout and theming |
| `script.js` | Walk-in status, hero animation, estimator, request summary |

To change rates, edit `RATE`, `MINIMUM` and `SESSION_MAX` at the top of `script.js`. Flash prices live in the `FLASH` object there and in the flash cards in `index.html`.
