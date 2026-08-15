import { ImageResponse } from "next/og";
import { SparkleMark, BRAND_GRADIENT } from "@/lib/brand-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <SparkleMark size={20} />
      </div>
    ),
    size
  );
}
