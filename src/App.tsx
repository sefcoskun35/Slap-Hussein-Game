import { useState, useEffect, useRef, useCallback } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
const GAME_DURATION = 30;
const CHAR_W = 180;
const CHAR_H = 200;
const MOVE_INTERVAL = 700;
const SLOW_THRESHOLD_MS = 1500;

const SLAP_WAV = "data:audio/wav;base64,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";

function playSlap() {
  try {
    const audio = new Audio(SLAP_WAV);
    audio.volume = 0.85;
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

const queryClient = new QueryClient();

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

interface ScoreEntry {
  id: number;
  playerName: string;
  score: number;
  createdAt: string;
}

function useGetLeaderboard(params: { limit: number }) {
  return useQuery<{ scores: ScoreEntry[] }>({
    queryKey: ["/leaderboard"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/leaderboard?limit=${params.limit}`);
      if (!res.ok) throw new Error("Skor tablosu yüklenemedi");
      return res.json();
    },
  });
}

function useGetRank(score: number | null) {
  return useQuery<{ rank: number; total: number; isStrictRecord: boolean }>({
    queryKey: ["/leaderboard/rank", score],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/leaderboard/rank?score=${score}`);
      if (!res.ok) throw new Error("Sıralama alınamadı");
      return res.json();
    },
    enabled: score !== null,
  });
}

interface SubmitScoreError {
  status: number;
  message: string;
}

function useSubmitScore() {
  return useMutation<ScoreEntry, SubmitScoreError, { data: { playerName: string; score: number } }>({
    mutationFn: async ({ data }) => {
      const res = await fetch(`${API_BASE}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw { status: res.status, message: body?.error ?? "Skor kaydedilemedi" };
      }
      return res.json();
    },
  });
}

type GamePhase = "start" | "playing" | "ended";

interface SlapEffect {
  id: number;
  x: number;
  y: number;
}

interface FaceWound {
  threshold: number;
  x: number; y: number;
  rx: number; ry: number;
  color: string;
  shadow?: string;
}

const FACE_WOUNDS: FaceWound[] = [
  { threshold: 3,   x: 60,  y: 46, rx: 9,  ry: 6,  color: "rgba(210,55,55,0.62)",  shadow: "0 0 4px rgba(180,30,30,0.5)"  },
  { threshold: 10,  x: 120, y: 44, rx: 10, ry: 6,  color: "rgba(190,45,75,0.60)",  shadow: "0 0 4px rgba(160,20,60,0.45)" },
  { threshold: 20,  x: 70,  y: 27, rx: 13, ry: 7,  color: "rgba(55,18,18,0.58)",   shadow: "0 0 6px rgba(40,10,10,0.4)"   },
  { threshold: 32,  x: 112, y: 26, rx: 12, ry: 6,  color: "rgba(50,16,22,0.56)",   shadow: "0 0 6px rgba(35,8,12,0.4)"    },
  { threshold: 48,  x: 90,  y: 13, rx: 9,  ry: 3,  color: "rgba(220,18,18,0.88)",  shadow: "0 0 3px rgba(200,0,0,0.6)"    },
  { threshold: 65,  x: 90,  y: 39, rx: 9,  ry: 9,  color: "rgba(230,85,75,0.55)",  shadow: "0 0 5px rgba(210,50,50,0.4)"  },
  { threshold: 85,  x: 48,  y: 53, rx: 8,  ry: 6,  color: "rgba(155,42,125,0.54)", shadow: "0 0 4px rgba(120,20,100,0.4)" },
  { threshold: 110, x: 132, y: 52, rx: 8,  ry: 6,  color: "rgba(150,40,120,0.52)", shadow: "0 0 4px rgba(120,20,100,0.4)" },
  { threshold: 145, x: 90,  y: 61, rx: 11, ry: 6,  color: "rgba(200,58,58,0.60)",  shadow: "0 0 4px rgba(170,30,30,0.4)"  },
  { threshold: 190, x: 36,  y: 20, rx: 7,  ry: 9,  color: "rgba(125,32,62,0.56)",  shadow: "0 0 4px rgba(100,15,45,0.4)"  },
  { threshold: 240, x: 144, y: 20, rx: 7,  ry: 9,  color: "rgba(125,32,62,0.54)",  shadow: "0 0 4px rgba(100,15,45,0.4)"  },
  { threshold: 290, x: 22,  y: 36, rx: 6,  ry: 10, color: "rgba(200,38,38,0.66)",  shadow: "0 0 4px rgba(175,15,15,0.5)"  },
];

function HuseyinImage({ slapped, facingRight, score = 0 }: { slapped: boolean; facingRight: boolean; score?: number }) {
  const [imgError, setImgError] = useState(false);
  const activeWounds = FACE_WOUNDS.filter(w => score >= w.threshold);

  return (
    <div
      style={{
        position: "relative",
        width: CHAR_W,
        height: CHAR_H,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: slapped ? "brightness(1.3) saturate(1.5) hue-rotate(-10deg)" : "none",
        transform: `scaleX(${facingRight ? 1 : -1})`,
        transition: "filter 0.1s, transform 0.2s",
      }}
    >
      {imgError ? (
        <div
          style={{
            width: CHAR_W,
            height: CHAR_H,
            borderRadius: "50%",
            background: "#F5C57A",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "4px dashed #E8A855",
            color: "#A0856A",
            fontSize: 13,
            fontWeight: 600,
            textAlign: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 40 }}>👤</span>
          <span>huseyin.png<br />bekleniyor…</span>
        </div>
      ) : (
        <img
          src={`${import.meta.env.BASE_URL}huseyin.png`}
          alt="Hüseyin"
          onError={() => setImgError(true)}
          draggable={false}
          style={{
            width: CHAR_W,
            height: CHAR_H,
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
          }}
        />
      )}
      {activeWounds.map((w, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: w.x - w.rx,
            top: w.y - w.ry,
            width: w.rx * 2,
            height: w.ry * 2,
            borderRadius: "50%",
            background: w.color,
            boxShadow: w.shadow,
            pointerEvents: "none",
            transition: "opacity 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}

function LeaderboardPanel({ onClose }: { onClose: () => void }) {
  const { data, isLoading, isError, refetch } = useGetLeaderboard({ limit: 10 });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
        animation: "fadeIn 0.25s ease",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 28,
          padding: "28px 24px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
          maxHeight: "80dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#2C3E50" }}>🏆 Skor Tablosu</div>
          <button
            onClick={onClose}
            style={{
              background: "#ECF0F1",
              border: "none",
              borderRadius: 12,
              width: 36,
              height: 36,
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7F8C8D",
            }}
          >
            ✕
          </button>
        </div>

        {isLoading && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#95A5A6", fontSize: 15 }}>
            Yükleniyor…
          </div>
        )}

        {isError && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ color: "#E74C3C", fontSize: 14, marginBottom: 12 }}>Skor tablosu yüklenemedi.</div>
            <button
              onClick={() => refetch()}
              style={{
                background: "#ECF0F1",
                border: "none",
                borderRadius: 10,
                padding: "8px 20px",
                cursor: "pointer",
                fontSize: 14,
                color: "#2C3E50",
              }}
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {data && data.scores.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#95A5A6", fontSize: 15 }}>
            Henüz skor yok. İlk sen ol!
          </div>
        )}

        {data && data.scores.length > 0 && (
          <div style={{ overflowY: "auto", flex: 1 }}>
            {data.scores.map((entry, idx) => {
              const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
              return (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 16,
                    marginBottom: 6,
                    background: idx === 0 ? "linear-gradient(135deg, #FFF9E6, #FFF3C7)" : idx % 2 === 0 ? "#F8F9FA" : "white",
                    border: idx === 0 ? "1.5px solid #F5C518" : "1.5px solid transparent",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: idx === 0 ? "#F5C518" : idx === 1 ? "#BDC3C7" : idx === 2 ? "#CD7F32" : "#ECF0F1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: medal ? 16 : 13,
                      fontWeight: 800,
                      color: idx < 3 ? "white" : "#7F8C8D",
                      flexShrink: 0,
                      marginRight: 12,
                    }}
                  >
                    {medal ?? (idx + 1)}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#2C3E50",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {entry.playerName}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: idx === 0 ? "#E67E22" : "#E74C3C",
                      marginLeft: 12,
                      flexShrink: 0,
                    }}
                  >
                    {entry.score}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const NICKNAME_KEY = "huseyine_saplak_nickname";

function useNickname() {
  const [nickname, setNicknameState] = useState<string>(() => {
    try {
      return localStorage.getItem(NICKNAME_KEY) ?? "";
    } catch {
      return "";
    }
  });

  const saveNickname = (value: string) => {
    const trimmed = value.slice(0, 50);
    setNicknameState(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(NICKNAME_KEY, trimmed);
      } else {
        localStorage.removeItem(NICKNAME_KEY);
      }
    } catch {
      // ignore storage errors
    }
  };

  return [nickname, saveNickname] as const;
}

const PERSONAL_BEST_KEY = "huseyine_saplak_best";

function usePersonalBest() {
  const [personalBest, setPersonalBestState] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(PERSONAL_BEST_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const updatePersonalBest = (score: number) => {
    if (score > personalBest) {
      setPersonalBestState(score);
      try {
        localStorage.setItem(PERSONAL_BEST_KEY, String(score));
      } catch {
        // ignore storage errors
      }
    }
  };

  return [personalBest, updatePersonalBest] as const;
}

function ScoreSubmitForm({
  score,
  initialName,
  onSubmitted,
  onNameChange,
}: {
  score: number;
  initialName: string;
  onSubmitted: () => void;
  onNameChange: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [submitted, setSubmitted] = useState(false);
  const { mutate, isPending, isError, error } = useSubmitScore();

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    mutate(
      { data: { playerName: trimmed, score } },
      {
        onSuccess: () => {
          setSubmitted(true);
          queryClient.invalidateQueries({ queryKey: ["/leaderboard"] });
          queryClient.invalidateQueries({ queryKey: ["/leaderboard/rank", score] });
          onSubmitted();
        },
      }
    );
  };

  if (submitted) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #EAFAF1, #D5F5E3)",
          border: "1.5px solid #82E0AA",
          borderRadius: 18,
          padding: "14px 20px",
          textAlign: "center",
          fontSize: 15,
          color: "#1E8449",
          fontWeight: 700,
        }}
      >
        ✅ Skor kaydedildi!
      </div>
    );
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: "20px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#7F8C8D",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 10,
          textAlign: "center",
        }}
      >
        Skoru Kaydet
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Adın nedir?"
          value={name}
          onChange={(e) => {
            const v = e.target.value.slice(0, 50);
            setName(v);
            onNameChange(v);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          maxLength={50}
          style={{
            flex: 1,
            border: "2px solid #ECF0F1",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 15,
            outline: "none",
            color: "#2C3E50",
            fontFamily: "inherit",
          }}
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={isPending || !name.trim()}
          style={{
            background:
              isPending || !name.trim()
                ? "#BDC3C7"
                : "linear-gradient(135deg, #E74C3C, #C0392B)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "10px 18px",
            fontSize: 18,
            cursor: isPending || !name.trim() ? "not-allowed" : "pointer",
            fontWeight: 800,
            transition: "background 0.2s",
          }}
        >
          {isPending ? "…" : "👋"}
        </button>
      </div>
      {isError && (
        <div style={{ color: "#E74C3C", fontSize: 12, marginTop: 6, textAlign: "center" }}>
          {error?.status === 429
            ? "Çok fazla deneme yaptın — biraz bekle ve tekrar dene."
            : error?.status === 400
            ? "Skor geçersiz görünüyor — oyunu tekrar oyna."
            : "Kaydedilemedi, tekrar dene."}
        </div>
      )}
    </div>
  );
}

function GameApp() {
  const [phase, setPhase] = useState<GamePhase>("start");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [slapped, setSlapped] = useState(false);
  const [effects, setEffects] = useState<SlapEffect[]>([]);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [facingRight, setFacingRight] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [nickname, saveNickname] = useNickname();
  const [personalBest, updatePersonalBest] = usePersonalBest();
  const personalBestRef = useRef(personalBest);
  personalBestRef.current = personalBest;
  const [endedScore, setEndedScore] = useState<number | null>(null);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);
  const rankQuery = useGetRank(endedScore);

  const [slowWarning, setSlowWarning] = useState(false);
  const lastSlapTimeRef = useRef<number>(0);
  const slowWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slappedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectCounterRef = useRef(0);
  const frozenRef = useRef(false);
  const posRef = useRef({ x: 50, y: 50 });
  const arenaRef = useRef<HTMLDivElement>(null);

  const getRandomPos = useCallback(() => {
    const arena = arenaRef.current;
    const aW = arena ? arena.clientWidth : 360;
    const aH = arena ? arena.clientHeight : 380;
    const maxX = aW - CHAR_W;
    const maxY = aH - CHAR_H;
    return {
      x: Math.max(0, Math.random() * maxX),
      y: Math.max(0, Math.random() * maxY),
    };
  }, []);

  const moveHuseyin = useCallback(() => {
    if (frozenRef.current) {
      frozenRef.current = false;
      return;
    }
    const next = getRandomPos();
    setFacingRight(next.x >= posRef.current.x);
    posRef.current = next;
    setPos(next);
  }, [getRandomPos]);

  const startGame = useCallback(() => {
    const start = { x: 80, y: 80 };
    posRef.current = start;
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setEffects([]);
    setSlapped(false);
    setFacingRight(true);
    setPos(start);
    setScoreSubmitted(false);
    setEndedScore(null);
    setIsNewPersonalBest(false);
    setSlowWarning(false);
    lastSlapTimeRef.current = 0;
    setPhase("playing");
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            clearInterval(runRef.current!);
            setScore((s) => {
              const prevBest = personalBestRef.current;
              setEndedScore(s);
              setIsNewPersonalBest(s > 0 && s > prevBest);
              updatePersonalBest(s);
              return s;
            });
            setPhase("ended");
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      runRef.current = setInterval(moveHuseyin, MOVE_INTERVAL);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (runRef.current) clearInterval(runRef.current);
    };
  }, [phase, moveHuseyin]);

  const handleSlap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (phase !== "playing") return;
      e.preventDefault();

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

      playSlap();

      const now = Date.now();
      if (lastSlapTimeRef.current > 0 && now - lastSlapTimeRef.current > SLOW_THRESHOLD_MS) {
        if (slowWarningTimerRef.current) clearTimeout(slowWarningTimerRef.current);
        setSlowWarning(true);
        slowWarningTimerRef.current = setTimeout(() => setSlowWarning(false), 1600);
      }
      lastSlapTimeRef.current = now;

      setScore((s) => s + 1);
      frozenRef.current = true;

      setSlapped(true);
      if (slappedTimerRef.current) clearTimeout(slappedTimerRef.current);
      slappedTimerRef.current = setTimeout(() => setSlapped(false), 200);

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
        justifyContent: phase === "playing" ? "flex-start" : "center",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        userSelect: "none",
        WebkitUserSelect: "none",
        overflowX: "hidden",
      }}
    >
      {/* START SCREEN */}
      {phase === "start" && (
        <div style={{ textAlign: "center", animation: "fadeIn 0.4s ease", padding: 20 }}>
          <div style={{ fontSize: "52px", fontWeight: 900, color: "#2C3E50", lineHeight: 1.1, marginBottom: 8 }}>
            👋 Hüseyin'e
          </div>
          <div style={{ fontSize: "52px", fontWeight: 900, color: "#E74C3C", lineHeight: 1.1, marginBottom: 24 }}>
            Şaplak!
          </div>
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
            <HuseyinImage slapped={false} facingRight={true} score={0} />
          </div>
          <p style={{ color: "#7F8C8D", fontSize: 17, marginBottom: 12 }}>
            Hüseyin kaçıyor — yakala ve şaplak at!
          </p>
          <p style={{ color: "#7F8C8D", fontSize: 15, marginBottom: 20 }}>
            Her tıklama = <strong>+1 puan</strong> · 30 saniye
          </p>

          {/* Nickname input */}
          <div style={{ marginBottom: 20, textAlign: "left" }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "#95A5A6",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              Takma adın
            </label>
            <input
              type="text"
              placeholder="Adını gir…"
              value={nickname}
              onChange={(e) => saveNickname(e.target.value)}
              maxLength={50}
              style={{
                width: "100%",
                border: "2px solid #ECF0F1",
                borderRadius: 14,
                padding: "12px 16px",
                fontSize: 16,
                outline: "none",
                color: "#2C3E50",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

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
              display: "block",
              width: "100%",
              marginBottom: 14,
            }}
          >
            🎮 OYNA
          </button>
          <button
            onClick={() => setShowLeaderboard(true)}
            style={{
              background: "white",
              color: "#2C3E50",
              border: "2px solid #ECF0F1",
              borderRadius: 16,
              padding: "14px 40px",
              fontSize: 17,
              fontWeight: 700,
              cursor: "pointer",
              width: "100%",
            }}
          >
            🏆 Skor Tablosu
          </button>
        </div>
      )}

      {/* GAME SCREEN */}
      {phase === "playing" && (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", height: "100dvh" }}>
          {/* HEADER */}
          <div style={{
            textAlign: "center",
            padding: "14px 16px 0",
            letterSpacing: "0.5px",
          }}>
            <span style={{
              fontSize: 20,
              fontWeight: 900,
              color: "#2C3E50",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}>👋 Hüseyin'e </span>
            <span style={{
              fontSize: 20,
              fontWeight: 900,
              color: "#E74C3C",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}>Şaplak At!</span>
          </div>

          {/* HUD */}
          <div style={{ padding: "8px 16px 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
                background: "white",
                borderRadius: 18,
                padding: "10px 20px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "#95A5A6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>PUAN</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#2C3E50", lineHeight: 1 }}>{score}</div>
              </div>
              <div style={{ fontSize: 13, color: "#BDC3C7", fontWeight: 600 }}>Yakala! 👋</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#95A5A6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>SÜRE</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: timerColor, lineHeight: 1, transition: "color 0.3s" }}>{timeLeft}s</div>
              </div>
            </div>
            <div style={{ height: 7, background: "#ECF0F1", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
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
          </div>

          {/* ARENA */}
          <div
            ref={arenaRef}
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              cursor: "default",
            }}
          >
            {/* Slow warning banner */}
            {slowWarning && (
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(231,76,60,0.92)",
                  color: "white",
                  borderRadius: 20,
                  padding: "8px 20px",
                  fontSize: 15,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  zIndex: 50,
                  pointerEvents: "none",
                  animation: "popUp 0.3s ease",
                  boxShadow: "0 4px 16px rgba(231,76,60,0.4)",
                }}
              >
                {nickname ? `${nickname} yavaş vur, ciğerimi deldin! 😤` : "Yavaş vuruyorsun, ciğerimi deldin! 😤"}
              </div>
            )}

            {/* Running character */}
            <div
              onClick={handleSlap}
              onTouchStart={handleSlap}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: CHAR_W,
                height: CHAR_H,
                cursor: "pointer",
                transition: slapped
                  ? "none"
                  : `left ${MOVE_INTERVAL * 0.6}ms cubic-bezier(0.4,0,0.2,1), top ${MOVE_INTERVAL * 0.6}ms cubic-bezier(0.4,0,0.2,1)`,
                animation: slapped ? "shake 0.15s ease" : "run 0.45s ease-in-out infinite",
              }}
            >
              <HuseyinImage slapped={slapped} facingRight={facingRight} score={score} />

              {/* ŞAP effects */}
              {effects.map((ef) => (
                <div
                  key={ef.id}
                  style={{
                    position: "absolute",
                    left: ef.x,
                    top: ef.y,
                    transform: "translate(-50%, -50%)",
                    fontSize: 30,
                    fontWeight: 900,
                    color: "#E74C3C",
                    pointerEvents: "none",
                    animation: "popUp 0.7s ease forwards",
                    textShadow: "0 2px 6px rgba(0,0,0,0.25)",
                    whiteSpace: "nowrap",
                    zIndex: 10,
                  }}
                >
                  ŞAP!
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* END SCREEN */}
      {phase === "ended" && (
        <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease", padding: 20, width: "100%", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#E74C3C", marginBottom: 4 }}>
            Hüseyin yakalandı!
          </div>
          <div style={{ fontSize: 17, color: "#7F8C8D", marginBottom: 20 }}>
            30 saniye bitti!
          </div>
          <div
            style={{
              background: "white",
              borderRadius: 24,
              padding: "28px 48px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              marginBottom: 20,
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

          {/* Rank badge */}
          {rankQuery.data && (() => {
            const { rank, total, isStrictRecord } = rankQuery.data;
            const isAllTimeRecord = isStrictRecord;
            const isTopThree = rank <= 3 && total > 1;
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
            const bg = isAllTimeRecord
              ? "linear-gradient(135deg, #FFF9E6, #FFF3C7)"
              : isNewPersonalBest
              ? "linear-gradient(135deg, #EAFAF1, #D5F5E3)"
              : isTopThree
              ? "linear-gradient(135deg, #EAF4FB, #D6EAF8)"
              : "linear-gradient(135deg, #F8F9FA, #ECF0F1)";
            const border = isAllTimeRecord
              ? "2px solid #F5C518"
              : isNewPersonalBest
              ? "2px solid #82E0AA"
              : isTopThree
              ? "2px solid #5DADE2"
              : "2px solid #D5D8DC";
            const textColor = isAllTimeRecord ? "#7D6608" : isNewPersonalBest ? "#1E8449" : isTopThree ? "#1A5276" : "#2C3E50";
            return (
              <div
                style={{
                  background: bg,
                  border,
                  borderRadius: 18,
                  padding: "14px 20px",
                  marginBottom: 16,
                  textAlign: "center",
                  animation: "fadeIn 0.4s ease",
                }}
              >
                {isAllTimeRecord && (
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#B7950B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    🏆 Tüm zamanların rekoru!
                  </div>
                )}
                {!isAllTimeRecord && isNewPersonalBest && (
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1E8449", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    ⭐ Yeni kişisel rekor!
                  </div>
                )}
                <div style={{ fontSize: 20, fontWeight: 900, color: textColor }}>
                  {medal ? `${medal} ` : ""}
                  {total === 0
                    ? "İlk oynayan sensin!"
                    : `${total} oyuncu arasında #${rank}. sıradasın!`}
                </div>
              </div>
            );
          })()}
          {rankQuery.isLoading && (
            <div style={{ textAlign: "center", fontSize: 14, color: "#95A5A6", marginBottom: 16 }}>
              Sıralaman hesaplanıyor…
            </div>
          )}

          <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
            <HuseyinImage slapped={false} facingRight={true} score={endedScore ?? 0} />
          </div>

          {/* Score submission */}
          <div style={{ marginBottom: 16, width: "100%" }}>
            <ScoreSubmitForm
              score={score}
              initialName={nickname}
              onSubmitted={() => setScoreSubmitted(true)}
              onNameChange={saveNickname}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
              }}
            >
              🔄 Tekrar Oyna
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              style={{
                background: "white",
                color: "#2C3E50",
                border: "2px solid #ECF0F1",
                borderRadius: 16,
                padding: "14px 40px",
                fontSize: 17,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🏆 Skor Tablosu
            </button>
          </div>
        </div>
      )}

      {showLeaderboard && <LeaderboardPanel onClose={() => setShowLeaderboard(false)} />}

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
          0%   { transform: rotate(0deg) scale(1); }
          25%  { transform: rotate(-8deg) scale(0.9); }
          75%  { transform: rotate(8deg) scale(0.9); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes run {
          0%   { transform: translateY(0px)   rotate(-4deg) scaleY(1);    }
          15%  { transform: translateY(-10px) rotate(0deg)  scaleY(1.04); }
          30%  { transform: translateY(-14px) rotate(4deg)  scaleY(1);    }
          45%  { transform: translateY(-8px)  rotate(0deg)  scaleY(0.97); }
          60%  { transform: translateY(0px)   rotate(-3deg) scaleY(1);    }
          75%  { transform: translateY(-6px)  rotate(0deg)  scaleY(1.02); }
          90%  { transform: translateY(-10px) rotate(3deg)  scaleY(1);    }
          100% { transform: translateY(0px)   rotate(-4deg) scaleY(1);    }
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; }
        input:focus { border-color: #E74C3C !important; }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GameApp />
    </QueryClientProvider>
  );
}
