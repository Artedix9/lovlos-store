import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LOVLOS — Good Vibes Defined.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#000000",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 80px",
          gap: 0,
        }}
      >
        {/* Wordmark */}
        <span
          style={{
            color: "#ffffff",
            fontSize: 132,
            fontWeight: 900,
            letterSpacing: "-5px",
            fontFamily: "Georgia, serif",
            lineHeight: 1,
          }}
        >
          LOVLOS
        </span>

        {/* Divider */}
        <div
          style={{
            width: 72,
            height: 1,
            background: "#444444",
            marginTop: 28,
            marginBottom: 24,
          }}
        />

        {/* Tagline */}
        <span
          style={{
            color: "#888888",
            fontSize: 20,
            letterSpacing: "8px",
            fontFamily: "Helvetica Neue, Arial, sans-serif",
            fontWeight: 400,
            textTransform: "uppercase",
          }}
        >
          GOOD VIBES DEFINED.
        </span>

        {/* Origin pill */}
        <span
          style={{
            color: "#555555",
            fontSize: 13,
            letterSpacing: "4px",
            fontFamily: "Helvetica Neue, Arial, sans-serif",
            fontWeight: 400,
            textTransform: "uppercase",
            marginTop: 20,
          }}
        >
          Tanzania · Est. 2025
        </span>
      </div>
    ),
    { ...size }
  );
}
