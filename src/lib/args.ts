import {isThemeMode, type ThemeMode} from '../theme.js'

export type Quality = number | 'best' | 'mp3'

export type CliArgs = {
  help: boolean
  version: boolean
  initialUrl?: string
  themeMode?: ThemeMode
  /** Set by --quality or --mp3: download straight away, no picker. */
  quality?: Quality
  /** -o: save to this folder for this run */
  outDir?: string
  error?: string
}

export function parseQuality(value: string): Quality | undefined {
  const v = value.trim().toLowerCase()
  if (v === 'best' || v === 'mp3') return v
  if (v === '4k') return 2160
  if (v === '2k') return 1440
  const height = Number.parseInt(v.replace(/p$/, ''), 10)
  return /^\d+p?$/.test(v) && height > 0 ? height : undefined
}

export function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {help: false, version: false}
  const positional: string[] = []

  const setTheme = (value: string | undefined) => {
    if (!value) return '--theme needs a value: auto, light, or dark'
    if (!isThemeMode(value)) return `unknown theme "${value}", use auto, light, or dark`
    result.themeMode = value
    return undefined
  }
  const setQuality = (value: string | undefined) => {
    const quality = value ? parseQuality(value) : undefined
    if (quality === undefined) return '--quality needs a value like best, 1080, 720 or mp3'
    result.quality = quality
    return undefined
  }

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!
    let error: string | undefined
    if (arg === '-h' || arg === '--help') result.help = true
    else if (arg === '-v' || arg === '--version') result.version = true
    else if (arg === '--theme') error = setTheme(args[++index])
    else if (arg.startsWith('--theme=')) error = setTheme(arg.slice('--theme='.length))
    else if (arg === '-q' || arg === '--quality') error = setQuality(args[++index])
    else if (arg.startsWith('--quality=')) error = setQuality(arg.slice('--quality='.length))
    else if (arg === '--mp3') result.quality = 'mp3'
    else if (arg === '-o' || arg === '--out') {
      const value = args[++index]
      if (value) result.outDir = value
      else error = '--out needs a folder'
    } else if (arg.startsWith('--out=')) result.outDir = arg.slice('--out='.length)
    else if (arg.startsWith('-')) error = `unknown option "${arg}"`
    else positional.push(arg)
    if (error) return {...result, error}
  }

  if (positional.length > 1) return {...result, error: 'expected a single url'}
  result.initialUrl = positional[0]
  if (result.quality !== undefined && !result.initialUrl && !result.help && !result.version) {
    return {...result, error: '--quality and --mp3 need a url'}
  }
  return result
}
