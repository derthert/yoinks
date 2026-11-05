import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {prepareOutDir} from './settings.js'

test('prepareOutDir creates the folder and returns an absolute path', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'yoinks-test-'))
  try {
    const dir = prepareOutDir(`"${path.join(base, 'new', 'folder')}"`)
    assert.equal(path.isAbsolute(dir), true)
    assert.equal(fs.statSync(dir).isDirectory(), true)
  } finally {
    fs.rmSync(base, {recursive: true, force: true})
  }
})

test('prepareOutDir expands ~ and rejects empty input and files', () => {
  assert.equal(prepareOutDir('~'), os.homedir())
  assert.throws(() => prepareOutDir('  '), /type a folder/)
  const file = path.join(os.tmpdir(), `yoinks-file-${process.pid}`)
  fs.writeFileSync(file, '')
  try {
    assert.throws(() => prepareOutDir(file))
  } finally {
    fs.rmSync(file, {force: true})
  }
})
