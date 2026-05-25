# FounderHQ Brand Assets

## Folder structure

```
brand/
  mark/              # Icon only, no wordmark, transparent background
    mark-white.png   # White mark — use on dark backgrounds
    mark-dark.png    # Dark mark — use on light backgrounds
    mark-white.svg
    mark-dark.svg

  logo/              # Icon + "FounderHQ" wordmark, transparent background
    logo-horizontal-white.png   # Side by side, white — dark backgrounds
    logo-horizontal-dark.png    # Side by side, dark — light backgrounds
    logo-stacked-white.png      # Icon above wordmark, white
    logo-stacked-dark.png       # Icon above wordmark, dark
    logo-horizontal-white.svg
    logo-horizontal-dark.svg

  app-icons/         # Solid background, used for favicons and install icons
    favicon-16.png
    favicon-32.png
    apple-touch-icon-180.png    # iOS home screen
    android-192.png             # PWA / Android
    android-512.png             # PWA splash

  social/
    og-image.png     # 1200x630 — link previews on Twitter, Slack, iMessage
```

## Usage guide

| Where | Which file |
|---|---|
| Browser tab | `app-icons/favicon-16.png` + `favicon-32.png` |
| iOS home screen | `app-icons/apple-touch-icon-180.png` |
| Site nav header | `logo/logo-horizontal-white.svg` |
| Sign-in screen | `logo/logo-stacked-white.svg` |
| Twitter/Slack preview | `social/og-image.png` |
| Social profile avatar | `app-icons/android-192.png` |
| Anywhere standalone (dark bg) | `mark/mark-white.svg` |
| Anywhere standalone (light bg) | `mark/mark-dark.svg` |
