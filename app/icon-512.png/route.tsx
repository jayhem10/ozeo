import { ImageResponse } from "next/og";
import { SparkleMark, BRAND_GRADIENT } from "@/lib/brand-icon";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_GRADIENT,
          borderRadius: 106,
        }}
      >
        <SparkleMark size={300} />
      </div>
    ),
    { width: 512, height: 512 }
  );
}
