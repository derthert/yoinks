import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const SETTINGS_FILE = path.join(os.homedir(), '.config', 'yoinks', 'settings.json')

export const DEFAULT_OUT_DIR = path.join(os.homedir(), 'Downloads')

type Settings = {outDir?: string}

function load(): Settings {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
    return parsed && typeof parsed === 'object' ? (parsed as Settings) : {}
  } catch {
    return {}
  }
}

/** The saved download folder, or ~/Downloads. */
export function loadOutDir(): string {
  const saved = load().outDir
  return typeof saved === 'string' && saved ? saved : DEFAULT_OUT_DIR
}

export function saveOutDir(dir: string) {
  try {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), {recursive: true})
    fs.writeFileSync(SETTINGS_FILE, `${JSON.stringify({...load(), outDir: dir}, null, 2)}\n`)
  } catch {
    // still used for this session, just not remembered
  }
}

/** Expand ~, make absolute, and create the folder. Throws with a readable message if that fails. */
export function prepareOutDir(input: string): string {
  const trimmed = input.trim().replace(/^["']|["']$/g, '')
  if (!trimmed) throw new Error('type a folder path')
  const expanded = trimmed === '~' || /^~[\\/]/.test(trimmed) ? path.join(os.homedir(), trimmed.slice(1)) : trimmed
  const dir = path.resolve(expanded)
  try {
    fs.mkdirSync(dir, {recursive: true})
  } catch {
    throw new Error(`can't use ${dir}`)
  }
  if (!fs.statSync(dir).isDirectory()) throw new Error(`${dir} is not a folder`)
  return dir
}
