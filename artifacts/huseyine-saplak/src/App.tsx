import { useState, useEffect, useRef, useCallback } from "react";

const GAME_DURATION = 30;

type GamePhase = "start" | "playing" | "ended";

interface SlapEffect {
  id: number;
  x: number;
  y: number;
}

function HuseyinImage({ slapped }: { slapped: boolean }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{
        width: 260,
        height: 260,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: slapped ? "brightness(1.25) saturate(1.5) hue-rotate(-10deg)" : "none",
        transform: slapped ? "scale(0.92)" : "scale(1)",
        transition: "transform 0.1s, filter 0.1s",
      }}
    >
      {imgError ? (
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "#F5C57A",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "4px dashed #E8A855",
            color: "#A0856A",
            fontSize: 14,
            fontWeight: 600,
            textAlign: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 48 }}>👤</span>
          <span>huseyin.png<br />bekleniyor…</span>
        </div>
      ) : (
        <img
          src={`${import.meta.env.BASE_URL}huseyin.png`}
          alt="Hüseyin"
          onError={() => setImgError(true)}
          draggable={false}
          style={{
            width: 260,
            height: 260,
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState<GamePhase>("start");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [slapped, setSlapped] = useState(false);
  const [effects, setEffects] = useState<SlapEffect[]>([]);
  const [shake, setShake] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slappedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectCounterRef = useRef(0);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setEffects([]);
    setSlapped(false);
    setPhase("playing");
  };

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setPhase("ended");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleSlap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (phase !== "playing") return;

      let x = 0;
      let y = 0;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

      if ("touches" in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = (e as React.MouseEvent).clientX - rect.left;
        y = (e as React.MouseEvent).clientY - rect.top;
      }

      setScore((s) => s + 1);

      setSlapped(true);
      setShake(true);
      if (slappedTimerRef.current) clearTimeout(slappedTimerRef.current);
      slappedTimerRef.current = setTimeout(() => {
        setSlapped(false);
        setShake(false);
      }, 150);

      effectCounterRef.current += 1;
      const id = effectCounterRef.current;
      setEffects((prev) => [...prev, { id, x, y }]);
      setTimeout(() => {
        setEffects((prev) => prev.filter((ef) => ef.id !== id));
      }, 700);
    },
    [phase]
  );

  const timerColor =
    timeLeft <= 5 ? "#E74C3C" : timeLeft <= 10 ? "#F39C12" : "#27AE60";

  const timerPct = (timeLeft / GAME_DURATION) * 100;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #FFF9F0 0%, #FFE9D0 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        userSelect: "none",
        WebkitUserSelect: "none",
        overflowX: "hidden",
        padding: "20px",
      }}
    >
      {/* START SCREEN */}
      {phase === "start" && (
        <div style={{ textAlign: "center", animation: "fadeIn 0.4s ease" }}>
          <div style={{ fontSize: "52px", fontWeight: 900, color: "#2C3E50", lineHeight: 1.1, marginBottom: 8 }}>
            👋 Hüseyin'e
          </div>
          <div style={{ fontSize: "52px", fontWeight: 900, color: "#E74C3C", lineHeight: 1.1, marginBottom: 24 }}>
            Şaplak!
          </div>
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
            <HuseyinImage slapped={false} />
          </div>
          <p style={{ color: "#7F8C8D", fontSize: 17, marginBottom: 12 }}>
            30 saniyede eliminden geldiğince şaplak at!
          </p>
          <p style={{ color: "#7F8C8D", fontSize: 15, marginBottom: 32 }}>
            Her tıklama = <strong>+1 puan</strong>
          </p>
          <button
            onClick={startGame}
            style={{
              background: "linear-gradient(135deg, #27AE60, #2ECC71)",
              color: "white",
              border: "none",
              borderRadius: 20,
              padding: "20px 60px",
              fontSize: 28,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(39,174,96,0.45)",
              letterSpacing: 1,
              transition: "transform 0.1s",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🎮 OYNA
          </button>
        </div>
      )}

      {/* GAME SCREEN */}
      {phase === "playing" && (
        <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
          {/* HUD */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              background: "white",
              borderRadius: 20,
              padding: "14px 24px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#95A5A6", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                PUAN
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#2C3E50", lineHeight: 1 }}>
                {score}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#95A5A6", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                SÜRE
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: timerColor, lineHeight: 1, transition: "color 0.3s" }}>
                {timeLeft}s
              </div>
            </div>
          </div>

          {/* Timer bar */}
          <div style={{ height: 8, background: "#ECF0F1", borderRadius: 4, marginBottom: 24, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${timerPct}%`,
                background: timerColor,
                borderRadius: 4,
                transition: "width 0.9s linear, background 0.3s",
              }}
            />
          </div>

          {/* Character — tıklanabilir alan */}
          <div
            style={{ position: "relative", display: "inline-block", cursor: "pointer" }}
            onClick={handleSlap}
            onTouchStart={handleSlap}
          >
            <div
              style={{
                animation: shake ? "shake 0.12s ease" : "none",
              }}
            >
              <HuseyinImage slapped={slapped} />
            </div>
            {/* Slap effects */}
            {effects.map((ef) => (
              <div
                key={ef.id}
                style={{
                  position: "absolute",
                  left: ef.x,
                  top: ef.y,
                  transform: "translate(-50%, -50%)",
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#E74C3C",
                  pointerEvents: "none",
                  animation: "popUp 0.7s ease forwards",
                  textShadow: "0 2px 6px rgba(0,0,0,0.25)",
                  whiteSpace: "nowrap",
                }}
              >
                ŞAP!
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, color: "#BDC3C7", fontSize: 15 }}>
            Hüseyin'e tıkla! 👆
          </div>
        </div>
      )}

      {/* END SCREEN */}
      {phase === "ended" && (
        <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#E74C3C", marginBottom: 4 }}>
            Hüseyin yakalandı!
          </div>
          <div style={{ fontSize: 17, color: "#7F8C8D", marginBottom: 24 }}>
            30 saniye bitti!
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 24,
              padding: "28px 48px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              marginBottom: 24,
              display: "inline-block",
            }}
          >
            <div style={{ fontSize: 14, color: "#95A5A6", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              Toplam Puan
            </div>
            <div style={{ fontSize: 72, fontWeight: 900, color: "#2C3E50", lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ fontSize: 16, color: "#7F8C8D", marginTop: 4 }}>
              şaplak vurdun! 👋
            </div>
          </div>

          <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
            <HuseyinImage slapped={true} />
          </div>

          <button
            onClick={startGame}
            style={{
              background: "linear-gradient(135deg, #27AE60, #2ECC71)",
              color: "white",
              border: "none",
              borderRadius: 20,
              padding: "18px 52px",
              fontSize: 24,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(39,174,96,0.4)",
              letterSpacing: 1,
              transition: "transform 0.1s",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🔄 Tekrar Oyna
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popUp {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(0.6); }
          40%  { opacity: 1; transform: translate(-50%, -80%) scale(1.3); }
          100% { opacity: 0; transform: translate(-50%, -130%) scale(1); }
        }
        @keyframes shake {
          0%   { transform: rotate(0deg); }
          25%  { transform: rotate(-6deg) scale(0.95); }
          75%  { transform: rotate(6deg) scale(0.95); }
          100% { transform: rotate(0deg); }
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
