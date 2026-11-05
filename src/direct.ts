import {formatBytes, formatEta, formatSpeed} from './lib/format.js'
import type {Quality} from './lib/args.js'
import {isProbablyUrl} from './lib/platforms.js'
import {download, ensureYtDlp, findFfmpeg, qualityChoice, type DownloadProgress} from './lib/ytdlp.js'

/** No-UI mode: download one url at the given quality and print where it went. Returns an exit code. */
export async function directDownload(url: string, quality: Quality, outDir: string): Promise<number> {
  if (!isProbablyUrl(url)) {
    console.error('yoinks: that does not look like a link, paste a full url')
    return 1
  }

  const controller = new AbortController()
  const onSigint = () => controller.abort()
  process.once('SIGINT', onSigint)

  const tty = Boolean(process.stderr.isTTY)
  const status = (text: string) => {
    if (tty) process.stderr.write(`\r\x1b[2K${text}`)
  }

  const choice = qualityChoice(quality)
  try {
    const ytdlp = await ensureYtDlp(message => status(message), controller.signal)
    status(`yoinking ${choice.label}…`)
    const filepath = await download(
      {ytdlp, ffmpegLocation: await findFfmpeg(), url, choice, outDir},
      {
        onProgress: progress => status(progressLine(progress)),
        onProcessing: () => status('processing…'),
      },
      controller.signal,
    )
    status('')
    console.log(`✓ yoinked → ${filepath}`)
    return 0
  } catch (error) {
    status('')
    if (controller.signal.aborted) {
      console.error('cancelled')
      return 130
    }
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
    return 1
  } finally {
    process.off('SIGINT', onSigint)
  }
}

function progressLine(p: DownloadProgress): string {
  const part = p.totalParts > 1 ? `part ${p.part + 1}/${p.totalParts}  ` : ''
  const percent = p.totalBytes ? `${Math.floor((p.downloadedBytes / p.totalBytes) * 100)}%` : formatBytes(p.downloadedBytes)
  const speed = p.speed ? `  ${formatSpeed(p.speed)}` : ''
  const eta = p.eta ? `  ${formatEta(p.eta)} left` : ''
  return `${part}${percent}${speed}${eta}`
}
