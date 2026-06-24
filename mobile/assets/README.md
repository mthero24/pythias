# Per-store assets

`icon.png` (1024×1024) and `splash.png` are **generated per store** from the seller's brand identity
(logo + theme colors) and placed here by the build pipeline right before `eas build`.

They are intentionally **not committed** (see `.gitignore`) — each store's build supplies its own.
For local dev you can drop any placeholder `icon.png` / `splash.png` here.
