import Image from "next/image";

/**
 * Drop-in image slot. Until a real photo exists, it renders an on-brand
 * "focus frame" placeholder (four corner brackets = viewfinder, per the GRID
 * logo concept) with a caption telling you exactly what shot belongs here and
 * the filename to drop into /public.
 *
 * To use your own photo: drop a file at `public/<src>` and pass `src`.
 *   <ImagePlaceholder src="grid/hero-twilight.jpg" label="Real-estate twilight" />
 */
export function ImagePlaceholder({
  label,
  hint,
  src,
  className = "",
  priority = false,
}: {
  label?: string;
  hint?: string;
  src?: string;
  className?: string;
  priority?: boolean;
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={`/${src.replace(/^\//, "")}`}
          alt={label ?? ""}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`group/ph relative overflow-hidden bg-[radial-gradient(120%_120%_at_30%_0%,#15161a_0%,#0b0c0f_55%,#050608_100%)] ${className}`}
    >
      {/* drifting accent orb for cinematic depth */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-grid-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-aerial-cyan/10 blur-3xl" />

      {/* viewfinder corner brackets */}
      <span className="absolute left-4 top-4 h-5 w-5 border-l border-t border-white/30" />
      <span className="absolute right-4 top-4 h-5 w-5 border-r border-t border-white/30" />
      <span className="absolute bottom-4 left-4 h-5 w-5 border-b border-l border-white/30" />
      <span className="absolute bottom-4 right-4 h-5 w-5 border-b border-r border-white/30" />

      {label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-6 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">
            {label}
          </span>
          {hint && (
            <span className="font-mono text-[10px] text-white/25">{hint}</span>
          )}
        </div>
      )}
    </div>
  );
}
