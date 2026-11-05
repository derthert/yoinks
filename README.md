# yoinks

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
  <img src="assets/logo-light.svg" alt="yoinks" width="288">
</picture>

Paste a link, get the video.

Works with YouTube, YouTube Shorts, Instagram posts and reels, TikTok, X
(Twitter) and 1,800+ other sites. You get an mp4 in the quality you pick,
or an mp3 if you only want the sound. No ads, no fake buttons, no sign-up.

<img src="assets/home.png" alt="yoinks home screen" width="100%">

## Install

1. Install [Node.js](https://nodejs.org) 22 or newer.
2. Open a terminal and run:

```sh
npm install -g github:derthert/yoinks
```

That's it. The first time you download something, yoinks fetches what it
needs by itself (nothing else to install).

## Use

Open the app and paste a link:

```sh
yoinks
```

Or give the link directly and pick a quality from the list:

```sh
yoinks https://youtube.com/shorts/abc123
```

Or skip the list and get the file right away:

```sh
yoinks https://www.instagram.com/reel/abc123 -q 1080
yoinks https://x.com/user/status/123 -q best
yoinks https://www.tiktok.com/@user/video/123 --mp3
```

`-q` takes `best`, `4k`, `1440`, `1080`, `720`, `480` or `360`. If the video
isn't available in that quality, you get the closest one below it.

Files go to your **Downloads** folder.

<img src="assets/download-options.png" alt="quality picker" width="100%">

### In the app

- `↑` `↓` to choose, `enter` to download
- `esc` to go back or cancel
- `ctrl+c` to quit
- `ctrl+t` to switch between light and dark
- You can also click everything with the mouse.
- If you copied a link, press `tab` to paste it.

## Good to know

- yoinks uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) under the hood.
  If you already have it, yoinks uses yours. If not, it downloads it once
  into `~/.yoinks/bin` and checks that the file is genuine.
- Private posts and age-restricted videos may not work.
- Only download what you have the right to keep, and respect creators.

## For developers

```sh
npm install
npm run build
node dist/cli.js <url>
npm test
npm run typecheck
```

## License

[MIT](LICENSE)
