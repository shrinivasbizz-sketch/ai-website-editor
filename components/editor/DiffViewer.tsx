"use client";

interface Props {
  original: string;
  modified: string;
}

function tokenizeLine(line: string) {
  return line.trim();
}

export function DiffViewer({ original, modified }: Props) {
  const origLines = original.split("\n").map((l) => l.trimEnd());
  const modLines = modified.split("\n").map((l) => l.trimEnd());

  const maxLines = Math.max(origLines.length, modLines.length);

  return (
    <div className="grid grid-cols-2 gap-1 text-xs font-mono rounded overflow-hidden border border-white/10">
      {/* Headers */}
      <div className="bg-red-900/30 text-red-300 px-3 py-1 font-sans font-medium text-[11px]">
        Before
      </div>
      <div className="bg-green-900/30 text-green-300 px-3 py-1 font-sans font-medium text-[11px]">
        After
      </div>

      {/* Lines */}
      <div className="bg-zinc-950 overflow-auto max-h-64 px-0">
        {Array.from({ length: maxLines }).map((_, i) => {
          const line = origLines[i] ?? "";
          const changed = tokenizeLine(line) !== tokenizeLine(modLines[i] ?? "");
          return (
            <div
              key={i}
              className={`px-3 py-px leading-5 whitespace-pre ${changed ? "bg-red-900/25 text-red-300" : "text-zinc-400"}`}
            >
              {line || " "}
            </div>
          );
        })}
      </div>
      <div className="bg-zinc-950 overflow-auto max-h-64 px-0">
        {Array.from({ length: maxLines }).map((_, i) => {
          const line = modLines[i] ?? "";
          const changed = tokenizeLine(origLines[i] ?? "") !== tokenizeLine(line);
          return (
            <div
              key={i}
              className={`px-3 py-px leading-5 whitespace-pre ${changed ? "bg-green-900/25 text-green-300" : "text-zinc-400"}`}
            >
              {line || " "}
            </div>
          );
        })}
      </div>
    </div>
  );
}
