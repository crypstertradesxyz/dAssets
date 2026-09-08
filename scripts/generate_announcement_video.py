import os
import sys
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH, HEIGHT = 1080, 1080
FPS = 30
DURATION = 16  # 16 seconds
TOTAL_FRAMES = FPS * DURATION
OUTPUT_FILE = "dassets_announcement_cinematic.mp4"

# Luxury / Institutional Palette
BG_COLOR = (4, 6, 9)
TEXT_WHITE = (255, 255, 255)
TEXT_SILVER = (226, 232, 240)
TEXT_SLATE = (148, 163, 184)
TEXT_MUTED = (100, 116, 139)
EMERALD_GREEN = (0, 200, 5)
EMERALD_GLOW = (0, 200, 5, 40)
BORDER_COLOR = (255, 255, 255, 24)

# Fonts
HELVETICA_PATH = "/System/Library/Fonts/Helvetica.ttc"
MONACO_PATH = "/System/Library/Fonts/Monaco.ttf"

def get_font(path, size, index=0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.load_default()

font_headline = get_font(HELVETICA_PATH, 54, index=1)   # Bold
font_title = get_font(HELVETICA_PATH, 40, index=1)      # Bold
font_sub = get_font(HELVETICA_PATH, 26, index=0)        # Regular
font_body = get_font(HELVETICA_PATH, 22, index=0)       # Regular
font_mono_lg = get_font(MONACO_PATH, 34)
font_mono_md = get_font(MONACO_PATH, 22)
font_mono_sm = get_font(MONACO_PATH, 17)

# Load Logo
logo_img = None
if os.path.exists("public/logo.png"):
    try:
        logo_img = Image.open("public/logo.png").convert("RGBA")
    except Exception as e:
        print("Could not load logo:", e)

def ease_out_cubic(x):
    return 1 - math.pow(1 - x, 3)

def ease_in_out(x):
    return -(math.cos(math.pi * x) - 1) / 2

def draw_ambient_glow(base_img, cx, cy, radius, color):
    glow_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    glow_draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=color)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius // 2))
    base_img.alpha_composite(glow_layer)

def draw_precision_grid(draw, frame_idx):
    # Minimalist institutional dot matrix and fine crosshairs
    for x in range(80, WIDTH - 40, 80):
        for y in range(120, HEIGHT - 100, 80):
            draw.point((x, y), fill=(255, 255, 255, 18))
    
    # Outer sleek viewport brackets
    bracket_len = 24
    draw.line([(40, 40), (40 + bracket_len, 40)], fill=(255, 255, 255, 40), width=1)
    draw.line([(40, 40), (40, 40 + bracket_len)], fill=(255, 255, 255, 40), width=1)
    draw.line([(WIDTH - 40, 40), (WIDTH - 40 - bracket_len, 40)], fill=(255, 255, 255, 40), width=1)
    draw.line([(WIDTH - 40, 40), (WIDTH - 40, 40 + bracket_len)], fill=(255, 255, 255, 40), width=1)
    draw.line([(40, HEIGHT - 40), (40 + bracket_len, HEIGHT - 40)], fill=(255, 255, 255, 40), width=1)
    draw.line([(40, HEIGHT - 40), (40, HEIGHT - 40 - bracket_len)], fill=(255, 255, 255, 40), width=1)
    draw.line([(WIDTH - 40, HEIGHT - 40), (WIDTH - 40 - bracket_len, HEIGHT - 40)], fill=(255, 255, 255, 40), width=1)
    draw.line([(WIDTH - 40, HEIGHT - 40), (WIDTH - 40, HEIGHT - 40 - bracket_len)], fill=(255, 255, 255, 40), width=1)

def render_frame(f):
    img = Image.new("RGBA", (WIDTH, HEIGHT), BG_COLOR + (255,))
    draw = ImageDraw.Draw(img)

    t = f / FPS
    draw_precision_grid(draw, f)

    # Ambient subtle backdrop illumination
    glow_r = int(240 + 30 * math.sin(t * 1.8))
    draw_ambient_glow(img, WIDTH // 2, HEIGHT // 2, glow_r, (0, 200, 5, 30))
    draw = ImageDraw.Draw(img)

    # Persistent Top Status Bar
    draw.line([(60, 80), (WIDTH - 60, 80)], fill=(255, 255, 255, 15), width=1)
    draw.text((60, 48), "dAssets // PROTOCOL RELEASE", font=font_mono_sm, fill=TEXT_MUTED)
    
    # Pulse status
    draw.ellipse([WIDTH - 320, 54, WIDTH - 312, 62], fill=EMERALD_GREEN)
    draw.text((WIDTH - 300, 48), "Robinhood Chain Mainnet (4663)", font=font_mono_sm, fill=TEXT_SLATE)

    # ========================================================
    # SCENE 1 (0s - 4.0s / frames 0 - 120): The Manifesto
    # ========================================================
    if f < 120:
        p = min(1.0, f / 24)
        alpha_y = int(380 - (1 - ease_out_cubic(p)) * 25)

        # Micro-badge
        badge_w = 340
        bx = (WIDTH - badge_w) // 2
        draw.rounded_rectangle([bx, 240, bx + badge_w, 282], radius=6, fill=(255, 255, 255, 8), outline=(255, 255, 255, 25), width=1)
        draw.text((WIDTH // 2, 261), "DECENTRALIZED DERIVATIVES", font=font_mono_sm, fill=TEXT_SILVER, anchor="mm")

        # Statement
        draw.text((WIDTH // 2, alpha_y), "Bringing tokenized leverage", font=font_headline, fill=TEXT_WHITE, anchor="mm")
        draw.text((WIDTH // 2, alpha_y + 70), "to life.", font=font_headline, fill=EMERALD_GREEN, anchor="mm")

        # Sub-manifesto
        draw.text((WIDTH // 2, alpha_y + 175), "Eliminating forced liquidations. Abstracting margin debt.", font=font_sub, fill=TEXT_SLATE, anchor="mm")
        draw.text((WIDTH // 2, alpha_y + 215), "Pure self-custodial leveraged ERC-20 architecture.", font=font_sub, fill=TEXT_WHITE, anchor="mm")

        # Architectural metadata pill
        draw.text((WIDTH // 2, 740), "NON-LIQUIDATABLE • PERMISSIONLESS • ON-CHAIN ORACLE", font=font_mono_sm, fill=TEXT_MUTED, anchor="mm")

    # ========================================================
    # SCENE 2 (4.0s - 8.0s / frames 120 - 240): Introducing dAssets
    # ========================================================
    elif f < 240:
        local_f = f - 120
        p = min(1.0, local_f / 22)
        y_pos = int(240 - (1 - ease_out_cubic(p)) * 20)

        # Section Tag
        draw.text((WIDTH // 2, y_pos), "INTRODUCING DASSETS", font=font_mono_md, fill=EMERALD_GREEN, anchor="mm")
        draw.text((WIDTH // 2, y_pos + 60), "The Sovereign Leverage Layer", font=font_headline, fill=TEXT_WHITE, anchor="mm")
        draw.text((WIDTH // 2, y_pos + 120), "Delta-hedged perpetual exposure deployed directly on Robinhood Chain", font=font_sub, fill=TEXT_SLATE, anchor="mm")

        # 3 Architectural Feature Columns
        cards = [
            ("ZERO DEBT RATIOS", "No borrowing interest. No margin calls. No sudden wipeouts on flash volatility."),
            ("AUTONOMOUS ORACLE", "24/7 continuous NAV streaming with mathematical daily 00:00 UTC rebalancing."),
            ("UNISWAP v3 CORE", "Deep concentrated liquidity generating non-stop swap fees from arbitrage volume.")
        ]

        start_y = 480
        for idx, (title, desc) in enumerate(cards):
            cy = start_y + idx * 105
            draw.rounded_rectangle([120, cy, WIDTH - 120, cy + 85], radius=12, fill=(11, 15, 22, 230), outline=(255, 255, 255, 20), width=1)
            
            # Index indicator
            draw.text((150, cy + 18), f"0{idx+1}", font=font_mono_sm, fill=EMERALD_GREEN)
            draw.text((200, cy + 16), title, font=font_title, fill=TEXT_WHITE)
            draw.text((200, cy + 52), desc, font=font_body, fill=TEXT_SLATE)

    # ========================================================
    # SCENE 3 (8.0s - 12.0s / frames 240 - 360): The Flagship Benchmark
    # ========================================================
    elif f < 360:
        local_f = f - 240
        p = min(1.0, local_f / 20)
        
        draw.text((WIDTH // 2, 190), "FLAGSHIP ASSET SPECIFICATION", font=font_mono_sm, fill=EMERALD_GREEN, anchor="mm")
        draw.text((WIDTH // 2, 245), "dBTC3L // Bitcoin 3x Long", font=font_headline, fill=TEXT_WHITE, anchor="mm")
        draw.text((WIDTH // 2, 300), "Robinhood Chain Verified Smart Contract (4663)", font=font_sub, fill=TEXT_SLATE, anchor="mm")

        # Terminal Style Spec Sheet
        sheet_x1, sheet_y1, sheet_x2, sheet_y2 = 140, 360, WIDTH - 140, 720
        draw.rounded_rectangle([sheet_x1, sheet_y1, sheet_x2, sheet_y2], radius=16, fill=(8, 11, 16, 240), outline=(255, 255, 255, 30), width=1)

        # Header of Spec
        draw.line([(sheet_x1, sheet_y1 + 55), (sheet_x2, sheet_y1 + 55)], fill=(255, 255, 255, 18), width=1)
        draw.text((sheet_x1 + 30, sheet_y1 + 20), "SPECIFICATION", font=font_mono_sm, fill=TEXT_MUTED)
        draw.text((sheet_x2 - 190, sheet_y1 + 20), "ON-CHAIN STATE", font=font_mono_sm, fill=TEXT_MUTED)

        specs = [
            ("Target Leverage", "+3.00x Long Exposure"),
            ("Underlying Benchmark", "Bitcoin (BTC/USD)"),
            ("Settlement Model", "Uniswap v3 AMM + NAV Peg"),
            ("Daily Rebalancing", "00:00 UTC Scheduled Reset"),
            ("Liquidation Risk", "0.00% (Strictly Non-Liquidatable)"),
            ("Contract Verification", "Robinhood Chain Blockscout")
        ]

        sy = sheet_y1 + 78
        for label, val in specs:
            draw.text((sheet_x1 + 30, sy), label, font=font_mono_md, fill=TEXT_SLATE)
            
            # Value highlighting
            val_color = EMERALD_GREEN if "0.00%" in val or "Verified" in val or "+3.00x" in val else TEXT_WHITE
            draw.text((sheet_x2 - 30, sy), val, font=font_mono_md, fill=val_color, anchor="ra")
            sy += 48

        # Live telemetry ticker bar
        draw.text((WIDTH // 2, 765), "LIVE ORACLE TICK: $1.0034 NAV  |  HEARTBEAT: 24/7 ACTIVE", font=font_mono_sm, fill=TEXT_SILVER, anchor="mm")

    # ========================================================
    # SCENE 4 (12.0s - 16.0s / frames 360 - 480): Brand Climax & Call to Action
    # ========================================================
    else:
        local_f = f - 360
        p = min(1.0, local_f / 24)
        scale = 0.90 + 0.10 * ease_out_cubic(p)

        # Concentric glowing radar rings
        for r_idx in range(4):
            ring_rad = int(140 + ((local_f * 3 + r_idx * 60) % 240))
            draw.ellipse([WIDTH//2 - ring_rad, 360 - ring_rad, WIDTH//2 + ring_rad, 360 + ring_rad], outline=(0, 200, 5, max(0, 60 - ring_rad // 4)), width=1)

        # Logo Render
        if logo_img:
            lw = int(210 * scale)
            lh = int(210 * scale)
            resized = logo_img.resize((lw, lh), Image.Resampling.LANCZOS)
            img.alpha_composite(resized, (WIDTH // 2 - lw // 2, 360 - lh // 2))

        # Brand Headline
        draw.text((WIDTH // 2, 520), "dAssets", font=font_headline, fill=TEXT_WHITE, anchor="mm")
        draw.text((WIDTH // 2, 580), "The Standard for Tokenized Leverage", font=font_title, fill=EMERALD_GREEN, anchor="mm")
        draw.text((WIDTH // 2, 635), "Live on Robinhood Chain Mainnet", font=font_sub, fill=TEXT_SLATE, anchor="mm")

        # URL Card
        card_w = 460
        cx1 = (WIDTH - card_w) // 2
        draw.rounded_rectangle([cx1, 700, cx1 + card_w, 755], radius=10, fill=(255, 255, 255, 10), outline=(255, 255, 255, 28), width=1)
        draw.text((WIDTH // 2, 728), "www.dassetsrh.xyz", font=font_mono_md, fill=TEXT_WHITE, anchor="mm")

        # Official Twitter handle
        draw.text((WIDTH // 2, 800), "Follow @dAssetsRH on X", font=font_mono_md, fill=TEXT_SILVER, anchor="mm")

    # Bottom Persistent Frame
    draw.line([(60, HEIGHT - 70), (WIDTH - 60, HEIGHT - 70)], fill=(255, 255, 255, 15), width=1)
    draw.text((60, HEIGHT - 48), "270+ Leveraged Pairs • Zero Liquidation Risk", font=font_mono_sm, fill=TEXT_MUTED)
    draw.text((WIDTH - 60, HEIGHT - 48), "https://x.com/dAssetsRH", font=font_mono_sm, fill=TEXT_SLATE, anchor="ra")

    return img.convert("RGB")

def main():
    print(f"🎬 Generating Institutional Announcement Video ({WIDTH}x{HEIGHT} @ {FPS}fps, {DURATION}s)...")
    
    ffmpeg_cmd = [
        "/opt/homebrew/bin/ffmpeg",
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "18",
        OUTPUT_FILE
    ]

    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

    for f in range(TOTAL_FRAMES):
        if f % 45 == 0:
            pct = (f / TOTAL_FRAMES) * 100
            print(f"  Rendering frame {f}/{TOTAL_FRAMES} ({pct:.1f}%)...")
        
        frame = render_frame(f)
        proc.stdin.write(frame.tobytes())

    proc.stdin.close()
    proc.wait()
    print(f"✓ Video generated: {OUTPUT_FILE}")
    print(f"  File size: {os.path.getsize(OUTPUT_FILE) / 1024:.1f} KB")

if __name__ == "__main__":
    main()
