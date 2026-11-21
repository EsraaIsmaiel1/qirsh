# Qirsh brand files

Qirsh (قرش), *every qirsh counts* / *كل قرش بيفرق*. The full brand guide (logo rules, colours, type, voice) is the **Qirsh** design system page in Claude.

| Folder | What |
|---|---|
| `logos/svg/` | Master logo files: horizontal and stacked lockups, mark, English and Arabic wordmarks. `-on-dark` versions for Nile or dark backgrounds, mono versions for one-colour print. |
| `logos/png/` | The same logos as PNG @2x for docs and slides. |
| `app-icons/` | Ready-made Expo icon set: `icon.png`, Android adaptive layers and monochrome icon, light/dark splash icons, `favicon.png`. |
| `fonts/` | Readex Pro (Regular, Medium, SemiBold, Bold) with its open-font licence (`OFL.txt`). |
| `source/` | `build.py` regenerates every logo and icon from one geometry (needs Python with fonttools + uharfbuzz, and the Readex Pro font). |

## Colours
| Token | Hex | Use |
|---|---|---|
| nile-700 | `#0B5F57` | Brand colour, primary (light theme) |
| nile-300 | `#7CC6BA` | Primary (dark theme) |
| gold-500 | `#F0B341` | Coin gold: logo dots, highlights (fill only) |
| gold-600 | `#E29A1B` | Logo dots on light backgrounds |
| sand-50 | `#FAF6EC` | Light background |
| ink-900 | `#10201E` | Text (light theme) |
| night-950 | `#0A1412` | Dark background |
| green-600 / red-600 | `#18794E` / `#C23B2A` | Money in / money out (always with + / −) |
