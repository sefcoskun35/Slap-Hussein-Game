import { useState, useEffect, useRef, useCallback } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
const GAME_DURATION = 30; // game duration in seconds
const CHAR_W = 180;
const CHAR_H = 200;
const MOVE_INTERVAL = 700;
const SLOW_THRESHOLD_MS = 1500;

function playSlap() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const bufferSize = Math.floor(ctx.sampleRate * 0.13);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2.5);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1400;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.onended = () => ctx.close();
  } catch {
    // ignore audio errors
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

function HuseyinImage({ slapped, facingRight }: { slapped: boolean; facingRight: boolean }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{
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
            <HuseyinImage slapped={false} facingRight={true} />
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
              <HuseyinImage slapped={slapped} facingRight={facingRight} />

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
            <HuseyinImage slapped={true} facingRight={true} />
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
