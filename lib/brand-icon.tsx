// Shared "sparkle" glyph used to generate app icons via next/og ImageResponse.
// Mirrors lucide-react's Sparkles icon paths, rendered as raw SVG so it works
// inside satori (which can't process Tailwind classes or React components).
export function SparkleMark({ size, color = "#ffffff" }: { size: number; color?: string }) {
  // strokeWidth is in the 24-unit viewBox coordinate space — the svg width/height
  // props scale everything (including strokes) proportionally, so this must stay
  // constant across sizes rather than being recomputed in pixel space.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
        fill={color}
      />
      <path d="M20 2v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <path d="M22 4h-4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <circle cx="4" cy="20" r="2" fill={color} />
    </svg>
  );
}

export const BRAND_GRADIENT = "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)";
