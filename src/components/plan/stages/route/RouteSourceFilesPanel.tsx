import { IconFile, IconDownload } from '../../../icons'
import { downloadGpx } from './routeStage.helpers'

type SourceFile = { name: string; meta: string; coords: [number, number, number][] }

export function RouteSourceFilesPanel({ sourceFiles }: { sourceFiles: SourceFile[] }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3.5">
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">Source files</div>
      {sourceFiles.length === 0 ? (
        <p className="font-mono text-label text-text-dim leading-relaxed">
          No files yet — import a planned route .gpx above.
        </p>
      ) : sourceFiles.map((f, i) => (
        <div key={f.name} className={`flex items-center gap-2 py-1.5 ${i < sourceFiles.length - 1 ? 'border-b border-border' : ''}`}>
          <span className="text-text-mid shrink-0"><IconFile size={11} /></span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-body-sm text-text truncate">{f.name}</div>
            <div className="font-mono text-caption text-text-dim mt-0.5">{f.meta}</div>
          </div>
          <button
            onClick={() => downloadGpx(f.coords, f.name)}
            title="Download .gpx"
            className="p-1 rounded text-text-dim hover:text-amber transition-colors cursor-pointer bg-transparent border-none shrink-0"
          >
            <IconDownload size={11} />
          </button>
        </div>
      ))}
    </div>
  )
}
