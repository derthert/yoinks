import assert from 'node:assert/strict'
import test from 'node:test'
import {parseArgs} from './args.js'
import {isThemeMode, nextThemeMode, themeFor} from '../theme.js'

test('parses a url and a spaced theme option without confusing the value for the url', () => {
  assert.deepEqual(parseArgs(['--theme', 'light', 'https://example.com/video']), {
    help: false,
    version: false,
    themeMode: 'light',
    initialUrl: 'https://example.com/video',
  })
})

test('parses an equals-style theme option after the url', () => {
  assert.deepEqual(parseArgs(['https://example.com/video', '--theme=dark']), {
    help: false,
    version: false,
    themeMode: 'dark',
    initialUrl: 'https://example.com/video',
  })
})

test('rejects missing, invalid, and unknown options', () => {
  assert.match(parseArgs(['--theme']).error ?? '', /needs a value/)
  assert.match(parseArgs(['--theme', 'sepia']).error ?? '', /unknown theme/)
  assert.match(parseArgs(['--wat']).error ?? '', /unknown option/)
  assert.match(parseArgs(['one', 'two']).error ?? '', /single url/)
})

test('recognizes only supported modes and cycles through all of them', () => {
  assert.equal(isThemeMode('auto'), true)
  assert.equal(isThemeMode('light'), true)
  assert.equal(isThemeMode('dark'), true)
  assert.equal(isThemeMode('sepia'), false)
  assert.equal(nextThemeMode('auto'), 'light')
  assert.equal(nextThemeMode('light'), 'dark')
  assert.equal(nextThemeMode('dark'), 'auto')
})

test('auto delegates to terminal colors while forced modes own the full surface', () => {
  assert.deepEqual(themeFor('auto'), {
    mode: 'auto',
    primary: undefined,
    gray: undefined,
    dark: undefined,
    background: undefined,
    dimSecondary: true,
    inverseButton: true,
  })

  assert.equal(themeFor('light').background, '#ffffff')
  assert.equal(themeFor('light').primary, '#18181b')
  assert.equal(themeFor('dark').background, '#18181b')
  assert.equal(themeFor('dark').primary, '#ffffff')
})

test('quality flags turn on direct download', () => {
  assert.equal(parseArgs(['https://youtu.be/x', '-q', '720']).quality, 720)
  assert.equal(parseArgs(['https://youtu.be/x', '--quality=1080p']).quality, 1080)
  assert.equal(parseArgs(['https://youtu.be/x', '-q', '4k']).quality, 2160)
  assert.equal(parseArgs(['https://youtu.be/x', '-q', 'best']).quality, 'best')
  assert.equal(parseArgs(['https://youtu.be/x', '--mp3']).quality, 'mp3')
  assert.equal(parseArgs(['https://youtu.be/x']).quality, undefined)
})

test('rejects bad quality values and quality without a url', () => {
  assert.match(parseArgs(['https://youtu.be/x', '-q', 'huge']).error ?? '', /--quality needs/)
  assert.match(parseArgs(['https://youtu.be/x', '-q']).error ?? '', /--quality needs/)
  assert.match(parseArgs(['--mp3']).error ?? '', /need a url/)
})

test('reads the output folder flag', () => {
  assert.equal(parseArgs(['https://youtu.be/x', '-o', 'D:\Videos']).outDir, 'D:\Videos')
  assert.equal(parseArgs(['--out=~/clips', 'https://youtu.be/x']).outDir, '~/clips')
  assert.match(parseArgs(['https://youtu.be/x', '-o']).error ?? '', /needs a folder/)
})
