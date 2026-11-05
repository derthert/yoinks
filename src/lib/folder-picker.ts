import {execFile} from 'node:child_process'

export type PickResult = {status: 'picked'; path: string} | {status: 'cancelled'} | {status: 'unavailable'}

// TopMost owner so the dialog doesn't open behind the terminal
const WINDOWS_SCRIPT = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms
$owner = New-Object System.Windows.Forms.Form -Property @{TopMost = $true}
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Where should yoinks save your files?'
$dialog.SelectedPath = $env:YOINKS_START_DIR
if ($dialog.ShowDialog($owner) -eq 'OK') { Write-Output $dialog.SelectedPath }
`

type Picker = [command: string, args: string[]]

function pickers(startDir: string): Picker[] {
  if (process.platform === 'win32') {
    return [['powershell', ['-NoProfile', '-NonInteractive', '-STA', '-Command', WINDOWS_SCRIPT]]]
  }
  if (process.platform === 'darwin') {
    const script = `POSIX path of (choose folder with prompt "Where should yoinks save your files?" default location POSIX file ${JSON.stringify(startDir)})`
    return [['osascript', ['-e', script]]]
  }
  return [
    ['zenity', ['--file-selection', '--directory', `--filename=${startDir}/`]],
    ['kdialog', ['--getexistingdirectory', startDir]],
  ]
}

function run([command, args]: Picker, startDir: string): Promise<PickResult> {
  return new Promise(resolve => {
    execFile(
      command,
      args,
      {encoding: 'utf8', windowsHide: true, env: {...process.env, YOINKS_START_DIR: startDir}},
      (error, stdout) => {
        const picked = stdout.trim().replace(/\/$/, '')
        if (error && (error as NodeJS.ErrnoException).code === 'ENOENT') resolve({status: 'unavailable'})
        else if (picked) resolve({status: 'picked', path: picked})
        else resolve({status: 'cancelled'})
      },
    )
  })
}

/** Open the system's folder dialog. 'unavailable' means there is none, so ask for a typed path instead. */
export async function pickFolder(startDir: string): Promise<PickResult> {
  for (const picker of pickers(startDir)) {
    const result = await run(picker, startDir)
    if (result.status !== 'unavailable') return result
  }
  return {status: 'unavailable'}
}
