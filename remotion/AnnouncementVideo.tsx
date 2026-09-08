import React from 'react';
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Img,
  staticFile,
} from 'remotion';

export const AnnouncementVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Color constants
  const RH_GREEN = '#00C805';
  const BG_COLOR = '#05070A';

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: BG_COLOR,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Background Animated Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 750,
          height: 750,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(0, 200, 5, 0.12) 0%, rgba(0, 200, 5, 0) 70%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle Precision Grid Lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          opacity: 0.8,
        }}
      />

      {/* Persistent Sleek Header */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 60,
          right: 60,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: 15,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Img src={staticFile('logo.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>dAssets</span>
          <span style={{ fontSize: 13, color: '#64748B', fontFamily: 'monospace' }}>// PROTOCOL RELEASE</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontFamily: 'monospace',
            color: '#94A3B8',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: RH_GREEN,
              boxShadow: `0 0 10px ${RH_GREEN}`,
            }}
          />
          <span>Robinhood Chain Mainnet (4663)</span>
        </div>
      </div>

      {/* ======================================================= */}
      {/* SCENE 1: The Hook & Manifesto (Frames 0 - 120 / 0s - 4s) */}
      {/* ======================================================= */}
      <Sequence from={0} durationInFrames={120}>
        {(() => {
          const s1Spring = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
          const fadeOut = interpolate(frame, [100, 120], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

          return (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '0 80px',
                opacity: fadeOut,
                transform: `scale(${interpolate(s1Spring, [0, 1], [0.95, 1])}) translateY(${interpolate(s1Spring, [0, 1], [30, 0])}px)`,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 20px',
                  borderRadius: 30,
                  backgroundColor: 'rgba(0, 200, 5, 0.08)',
                  border: `1px solid rgba(0, 200, 5, 0.25)`,
                  color: RH_GREEN,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                  marginBottom: 32,
                }}
              >
                <span>NEXT-GEN DECENTRALIZED DERIVATIVES</span>
              </div>

              <h1
                style={{
                  fontSize: 66,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  margin: 0,
                  marginBottom: 16,
                }}
              >
                Bringing tokenized leverage <br />
                <span
                  style={{
                    background: `linear-gradient(135deg, #00C805 0%, #38BDF8 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  to life.
                </span>
              </h1>

              <p
                style={{
                  fontSize: 24,
                  color: '#94A3B8',
                  maxWidth: 780,
                  lineHeight: 1.5,
                  margin: '0 0 36px 0',
                }}
              >
                Traditional margin models wipe you out on flash crashes. <br />
                <strong style={{ color: '#FFFFFF' }}>dAssets eliminates liquidation risk forever.</strong>
              </p>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                {['NO MARGIN CALLS', 'NO DEBT RATIOS', 'SELF-CUSTODIAL ERC-20'].map((tag) => (
                  <div
                    key={tag}
                    style={{
                      padding: '8px 18px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: '#E2E8F0',
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </Sequence>

      {/* ======================================================= */}
      {/* SCENE 2: The Core Value Pillars (Frames 120 - 240 / 4s - 8s) */}
      {/* ======================================================= */}
      <Sequence from={115} durationInFrames={130}>
        {(() => {
          const s2Frame = frame - 115;
          const s2Spring = spring({ frame: s2Frame, fps, config: { damping: 14, mass: 0.6 } });
          const fadeOut = interpolate(s2Frame, [110, 125], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

          const pillars = [
            {
              num: '01',
              title: 'Zero Forced Liquidation',
              desc: 'Autonomous rebalancer automatically de-leverages on sharp market drops to preserve your token principal.',
            },
            {
              num: '02',
              title: 'Live 24/7 Oracle Telemetry',
              desc: 'Continuous on-chain NAV streaming powered by Railway keeper with scheduled 00:00 UTC rebalances.',
            },
            {
              num: '03',
              title: 'Uniswap v3 AMM Liquidity',
              desc: 'Direct on-chain AMM pools generating non-stop swap fee yield for LPs from arbitrage volume.',
            },
          ];

          return (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 80px',
                opacity: fadeOut,
                transform: `scale(${interpolate(s2Spring, [0, 1], [0.96, 1])})`,
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: RH_GREEN,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Architectural Breakthrough
                </span>
                <h2 style={{ fontSize: 46, fontWeight: 800, margin: '8px 0 0 0', letterSpacing: '-0.02em' }}>
                  The Sovereign Leverage Layer
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pillars.map((item, idx) => {
                  const cardSpring = spring({
                    frame: s2Frame - idx * 6,
                    fps,
                    config: { damping: 12, mass: 0.5 },
                  });

                  return (
                    <div
                      key={item.num}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 24,
                        padding: '22px 28px',
                        backgroundColor: 'rgba(13, 16, 22, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 16,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        transform: `translateY(${interpolate(cardSpring, [0, 1], [30, 0])}px)`,
                        opacity: cardSpring,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 18,
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          color: RH_GREEN,
                          width: 40,
                        }}
                      >
                        {item.num}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                        <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.4 }}>{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </Sequence>

      {/* ======================================================= */}
      {/* SCENE 3: Flagship dBTC3L Live Terminal (Frames 240 - 360 / 8s - 12s) */}
      {/* ======================================================= */}
      <Sequence from={240} durationInFrames={125}>
        {(() => {
          const s3Frame = frame - 240;
          const s3Spring = spring({ frame: s3Frame, fps, config: { damping: 14, mass: 0.6 } });
          const fadeOut = interpolate(s3Frame, [110, 125], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

          // Simulated continuous price surge
          const simPct = interpolate(s3Frame, [0, 100], [0, 6.4], { extrapolateRight: 'clamp' });
          const navValue = (1.0000 + (simPct / 100)).toFixed(4);
          const btcPrice = (78500 + (simPct * 320)).toFixed(0);

          return (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '0 80px',
                opacity: fadeOut,
                transform: `scale(${interpolate(s3Spring, [0, 1], [0.96, 1])})`,
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 14px',
                    borderRadius: 20,
                    backgroundColor: 'rgba(0, 200, 5, 0.1)',
                    border: '1px solid rgba(0, 200, 5, 0.3)',
                    color: RH_GREEN,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  <span>LIVE ON-CHAIN BENCHMARK</span>
                </div>
                <h2 style={{ fontSize: 44, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  dBTC3L // Bitcoin 3x Long
                </h2>
              </div>

              {/* Glassmorphic Trading Terminal Card */}
              <div
                style={{
                  width: '100%',
                  maxWidth: 780,
                  backgroundColor: 'rgba(9, 12, 16, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: 20,
                  padding: '30px 36px',
                  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(30px)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                      Continuous Oracle NAV
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 4 }}>
                      <span style={{ fontSize: 48, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                        ${navValue}
                      </span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: RH_GREEN, fontFamily: 'monospace' }}>
                        +{simPct.toFixed(2)}% (3x Target)
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                      Bitcoin Benchmark
                    </span>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', marginTop: 4 }}>
                      ${Number(btcPrice).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Animated Mini SVG Chart */}
                <div
                  style={{
                    height: 90,
                    width: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 10,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: 24,
                  }}
                >
                  <svg viewBox="0 0 700 90" style={{ width: '100%', height: '100%' }}>
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00C805" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#00C805" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,80 Q 180,70 320,50 T 700,15 L 700,90 L 0,90 Z"
                      fill="url(#chartGlow)"
                    />
                    <path
                      d="M 0,80 Q 180,70 320,50 T 700,15"
                      fill="none"
                      stroke="#00C805"
                      strokeWidth="3"
                    />
                  </svg>
                </div>

                {/* Specs Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16,
                    paddingTop: 16,
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    fontFamily: 'monospace',
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span style={{ color: '#64748B', display: 'block' }}>FORCED LIQUIDATION</span>
                    <strong style={{ color: RH_GREEN, fontSize: 14 }}>0.00% (IMMUNE)</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block' }}>REBALANCE CADENCE</span>
                    <strong style={{ color: '#FFFFFF', fontSize: 14 }}>00:00 UTC Daily</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block' }}>ROBINHOOD CA</span>
                    <strong style={{ color: '#38BDF8', fontSize: 14 }}>0x5164...56F6</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Sequence>

      {/* ======================================================= */}
      {/* SCENE 4: Brand Climax & Call to Action (Frames 360 - 480 / 12s - 16s) */}
      {/* ======================================================= */}
      <Sequence from={360} durationInFrames={120}>
        {(() => {
          const s4Frame = frame - 360;
          const s4Spring = spring({ frame: s4Frame, fps, config: { damping: 12, mass: 0.5 } });

          return (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '0 80px',
                transform: `scale(${interpolate(s4Spring, [0, 1], [0.92, 1])})`,
              }}
            >
              {/* Brand Logo with Pulsing Shadow */}
              <div
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 36,
                  overflow: 'hidden',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: `0 0 80px rgba(0, 200, 5, 0.4)`,
                  marginBottom: 28,
                }}
              >
                <Img src={staticFile('logo.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <h1
                style={{
                  fontSize: 58,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                dAssets Protocol
              </h1>

              <p
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: RH_GREEN,
                  margin: '0 0 32px 0',
                  letterSpacing: '-0.01em',
                }}
              >
                The Standard for Tokenized Leverage
              </p>

              {/* URL Pill */}
              <div
                style={{
                  padding: '16px 42px',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  borderRadius: 14,
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  boxShadow: '0 10px 40px rgba(255, 255, 255, 0.2)',
                  marginBottom: 24,
                }}
              >
                https://www.dassetsrh.xyz
              </div>

              <div
                style={{
                  fontSize: 16,
                  fontFamily: 'monospace',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>Follow on X:</span>
                <strong style={{ color: '#FFFFFF' }}>@dAssetsRH</strong>
              </div>
            </div>
          );
        })()}
      </Sequence>

      {/* Persistent Bottom Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 60,
          right: 60,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: 12,
          fontFamily: 'monospace',
          color: '#64748B',
          zIndex: 50,
        }}
      >
        <span>270+ Leveraged Pairs • Zero Liquidation Risk</span>
        <span>x.com/dAssetsRH</span>
      </div>
    </div>
  );
};
