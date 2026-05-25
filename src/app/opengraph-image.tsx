import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Brand name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#818cf8",
            }}
          />
          <p
            style={{
              fontSize: "22px",
              fontWeight: "600",
              color: "#a1a1aa",
              letterSpacing: "0.04em",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            FounderHQ
          </p>
        </div>

        {/* Headline */}
        <p
          style={{
            fontSize: "68px",
            fontWeight: "700",
            color: "#ffffff",
            textAlign: "center",
            lineHeight: "1.08",
            margin: 0,
            marginBottom: "28px",
            letterSpacing: "-2.5px",
          }}
        >
          Know if your idea has legs
          <br />
          before you build it.
        </p>

        {/* Tagline */}
        <p
          style={{
            fontSize: "26px",
            color: "#71717a",
            textAlign: "center",
            margin: 0,
            marginBottom: "56px",
            letterSpacing: "-0.3px",
          }}
        >
          Do your homework before you ship.
        </p>

        {/* Source pills */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {["Reddit", "Hacker News", "GitHub", "Stack Overflow", "Product Hunt"].map((s) => (
            <div
              key={s}
              style={{
                backgroundColor: "#18181b",
                borderRadius: "100px",
                padding: "8px 18px",
                color: "#71717a",
                fontSize: "15px",
                border: "1px solid #27272a",
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
  );
}
