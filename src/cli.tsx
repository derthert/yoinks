import React from 'react'
import {createRequire} from 'node:module'
import {render} from 'ink'
import {App, type Outcome} from './app.js'
import {directDownload} from './direct.js'
import {captureFrames} from './lib/click-map.js'
import {parseArgs} from './lib/args.js'
import {loadOutDir, prepareOutDir} from './lib/settings.js'

const VERSION: string = createRequire(import.meta.url)('../package.json').version

const HELP = `
  yoinks - paste a link, get the video.

  Usage
    $ yoinks                       open the app and paste a link
    $ yoinks <url>                 pick a quality, then download
    $ yoinks <url> -q 720          download 720p mp4 right away
    $ yoinks <url> --mp3           download audio only
    $ yoinks <url> -o D:\\Videos    save somewhere else this time

  Options
    -q, --quality <q>  best, 2160 (4k), 1440, 1080, 720, 480, 360
    --mp3              audio only, as mp3
    -o, --out <dir>    folder to save to (this run only)
    --theme <mode>     auto, light or dark
    -h, --help         show this help
    -v, --version      show version

  Files are saved to your Downloads folder. Press ^o in the app to pick
  another folder, yoinks remembers it.
  Works with YouTube, Shorts, Instagram, TikTok, X and 1800+ other sites.
`

const args = parseArgs(process.argv.slice(2))

if (args.error) {
  console.error(`yoinks: ${args.error}\nTry "yoinks --help" for usage.`)
  process.exit(1)
}

if (args.help) {
  console.log(HELP)
  process.exit(0)
}

if (args.version) {
  console.log(VERSION)
  process.exit(0)
}

let outDir: string
try {
  outDir = args.outDir ? prepareOutDir(args.outDir) : loadOutDir()
} catch (error) {
  console.error(`yoinks: ${(error as Error).message}`)
  process.exit(1)
}

const isTTY = Boolean(process.stdout.isTTY && process.stdin.isTTY)

// a quality flag, or no terminal to draw in, means download straight away
if (args.initialUrl && (args.quality !== undefined || !isTTY)) {
  process.exit(await directDownload(args.initialUrl, args.quality ?? 'best', outDir))
}

const enterAltScreen = () => process.stdout.write('\x1b[?1049h\x1b[H')
// also turn mouse tracking off, a crash can skip React cleanup
const leaveAltScreen = () => process.stdout.write('\x1b[?1006l\x1b[?1000l\x1b[?1049l')

if (isTTY) {
  enterAltScreen()
  process.on('exit', leaveAltScreen)
  // restore the terminal first, or the crash message is wiped with the screen
  for (const event of ['uncaughtException', 'unhandledRejection'] as const) {
    process.on(event, (error: unknown) => {
      leaveAltScreen()
      console.error(error)
      process.exit(1)
    })
  }
}

let outcome: Outcome = {}
const {waitUntilExit} = render(
  <App
    initialUrl={args.initialUrl}
    initialThemeMode={args.themeMode ?? 'auto'}
    outDir={outDir}
    onOutcome={result => (outcome = result)}
  />,
  // the app handles ^c itself so a running download can clean up first
  {stdout: captureFrames(process.stdout), exitOnCtrlC: false},
)

await waitUntilExit()

if (isTTY) leaveAltScreen()
if (outcome.filepath) {
  console.log(`✓ yoinked → ${outcome.filepath}`)
}
