import os
import sys
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH, HEIGHT = 1080, 1080
FPS = 30
DURATION = 15  # seconds
TOTAL_FRAMES = FPS * DURATION
OUTPUT_FILE = "dassets_twitter_promo.mp4"

# Color Palette
BG_COLOR = (5, 7, 10)
TEXT_WHITE = (255, 255, 255)
TEXT_SLATE = (148, 163, 184)
TEXT_MUTED = (100, 116, 139)
RH_GREEN = (0, 200, 5)
RH_GREEN_GLOW = (0, 200, 5, 45)
RED_ACCENT = (239, 68, 68)
CYAN_ACCENT = (0, 240, 255)

# Fonts
HELVETICA_PATH = "/System/Library/Fonts/Helvetica.ttc"
MONACO_PATH = "/System/Library/Fonts/Monaco.ttf"

def get_font(path, size, index=0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.load_default()

font_hero = get_font(HELVETICA_PATH, 56, index=1)      # Bold
font_title = get_font(HELVETICA_PATH, 42, index=1)     # Bold
font_sub = get_font(HELVETICA_PATH, 28, index=0)       # Regular
font_small = get_font(HELVETICA_PATH, 22, index=0)
font_mono_lg = get_font(MONACO_PATH, 38)
font_mono_md = get_font(MONACO_PATH, 24)
font_mono_sm = get_font(MONACO_PATH, 18)

# Load Logo
logo_img = None
if os.path.exists("public/logo.png"):
    try:
        logo_img = Image.open("public/logo.png").convert("RGBA")
    except Exception as e:
        print("Could not load logo:", e)

def draw_grid(draw, frame_idx):
    offset_y = (frame_idx * 1.5) % 40
    for x in range(0, WIDTH, 60):
        draw.line([(x, 0), (x, HEIGHT)], fill=(255, 255, 255, 6), width=1)
    for y in range(int(offset_y) - 40, HEIGHT + 40, 40):
        draw.line([(0, y), (WIDTH, y)], fill=(255, 255, 255, 6), width=1)

def draw_ambient_glow(base_img, cx, cy, radius, color):
    glow_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    glow_draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=color)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius // 2))
    base_img.alpha_composite(glow_layer)

def ease_out_cubic(x):
    return 1 - math.pow(1 - x, 3)

def ease_in_out(x):
    return -(math.cos(math.pi * x) - 1) / 2

def render_frame(f):
    img = Image.new("RGBA", (WIDTH, HEIGHT), BG_COLOR + (255,))
    draw = ImageDraw.Draw(img)

    # Ambient Background Motion
    t = f / FPS
    draw_grid(draw, f)

    # Pulsing ambient glow
    glow_radius = int(220 + 40 * math.sin(t * 2))
    draw_ambient_glow(img, WIDTH // 2, HEIGHT // 2, glow_radius, RH_GREEN_GLOW)
    draw = ImageDraw.Draw(img)

    # Header Bar (persistent)
    draw.line([(60, 90), (WIDTH - 60, 90)], fill=(255, 255, 255, 20), width=1)
    draw.text((60, 52), "dAssets Protocol", font=font_mono_md, fill=TEXT_WHITE)
    
    # Pulse dot + Chain pill
    draw.ellipse([WIDTH - 300, 58, WIDTH - 290, 68], fill=RH_GREEN)
    draw.text((WIDTH - 280, 53), "Robinhood Chain (4663)", font=font_mono_sm, fill=TEXT_SLATE)

    # SCENE 1 (0s - 3.8s / frames 0 - 114): The Hook
    if f < 114:
        p = min(1.0, f / 24)
        alpha = int(255 * ease_out_cubic(p))
        
        # Red warning pill
        pill_w = 420
        pill_x = (WIDTH - pill_w) // 2
        draw.rounded_rectangle([pill_x, 240, pill_x + pill_w, 286], radius=20, fill=(239, 68, 68, 30), outline=RED_ACCENT, width=1)
        draw.text((pill_x + 28, 250), "TIRED OF LIQUIDATIONS?", font=font_mono_sm, fill=(252, 165, 165))

        # Main Question
        hook_y = int(370 - (1 - ease_out_cubic(p)) * 30)
        draw.text((WIDTH // 2, hook_y), "What if you held 3x leverage...", font=font_hero, fill=TEXT_WHITE, anchor="mm")
        draw.text((WIDTH // 2, hook_y + 80), "with ZERO margin calls?", font=font_hero, fill=RH_GREEN, anchor="mm")

        # Problem subtext
        draw.text((WIDTH // 2, hook_y + 190), "Traditional perps liquidate your entire wallet on flash wicks.", font=font_sub, fill=TEXT_SLATE, anchor="mm")
        draw.text((WIDTH // 2, hook_y + 235), "dAssets changes the rules.", font=font_sub, fill=TEXT_WHITE, anchor="mm")

        # Progress bar
        prog = f / 114
        draw.line([(pill_x, 780), (pill_x + int(pill_w * prog), 780)], fill=RH_GREEN, width=3)

    # SCENE 2 (3.8s - 7.6s / frames 114 - 228): The Solution (dBTC3L Spotlight)
    elif f < 228:
        local_f = f - 114
        p = min(1.0, local_f / 20)
        
        # Category badge
        draw.rounded_rectangle([WIDTH//2 - 130, 180, WIDTH//2 + 130, 222], radius=16, fill=(0, 200, 5, 25), outline=RH_GREEN, width=1)
        draw.text((WIDTH // 2, 201), "FLAGSHIP ASSET", font=font_mono_sm, fill=RH_GREEN, anchor="mm")

        # Asset Title
        draw.text((WIDTH // 2, 270), "dBTC3L • Bitcoin 3x Long", font=font_hero, fill=TEXT_WHITE, anchor="mm")
        draw.text((WIDTH // 2, 330), "Permissionless Leveraged Token on Robinhood Chain", font=font_sub, fill=TEXT_SLATE, anchor="mm")

        # Dynamic Ticker Card
        card_x1, card_y1, card_x2, card_y2 = 140, 390, WIDTH - 140, 710
        draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24, fill=(13, 16, 22, 240), outline=(255, 255, 255, 30), width=1)

        # BTC spot & NAV simulation
        sim_progress = min(1.0, local_f / 100)
        btc_price = 78500 + int(sim_progress * 1850)
        nav_price = 1.0000 + (sim_progress * 0.0710)
        gain_pct = (sim_progress * 7.1)

        draw.text((card_x1 + 40, card_y1 + 45), "UNDERLYING BENCHMARK", font=font_mono_sm, fill=TEXT_MUTED)
        draw.text((card_x1 + 40, card_y1 + 80), f"Bitcoin: ${btc_price:,}", font=font_mono_lg, fill=TEXT_WHITE)

        draw.text((card_x2 - 260, card_y1 + 45), "LEVERAGE TARGET", font=font_mono_sm, fill=TEXT_MUTED)
        draw.text((card_x2 - 260, card_y1 + 80), "+3.00x LONG", font=font_mono_lg, fill=RH_GREEN)

        draw.line([(card_x1 + 40, card_y1 + 145), (card_x2 - 40, card_y1 + 145)], fill=(255, 255, 255, 15), width=1)

        draw.text((card_x1 + 40, card_y1 + 175), "ORACLE NAV PRICE", font=font_mono_sm, fill=TEXT_MUTED)
        draw.text((card_x1 + 40, card_y1 + 225), f"${nav_price:.4f}", font=font_hero, fill=TEXT_WHITE)
        draw.text((card_x1 + 280, card_y1 + 230), f"+{gain_pct:.2f}% (3x Alpha)", font=font_title, fill=RH_GREEN)

        # Feature pills below card
        features = ["✓ Zero Margin Calls", "✓ ERC-20 Self-Custody", "✓ Uniswap v3 Yield"]
        fx = 150
        for feat in features:
            draw.text((fx, 760), feat, font=font_mono_sm, fill=TEXT_SLATE)
            fx += 280

    # SCENE 3 (7.6s - 11.4s / frames 228 - 342): Architecture & Autonomous Keeper
    elif f < 342:
        local_f = f - 228
        p = min(1.0, local_f / 20)

        draw.rounded_rectangle([WIDTH//2 - 180, 180, WIDTH//2 + 180, 222], radius=16, fill=(0, 240, 255, 20), outline=CYAN_ACCENT, width=1)
        draw.text((WIDTH // 2, 201), "AUTONOMOUS ON-CHAIN ENGINE", font=font_mono_sm, fill=CYAN_ACCENT, anchor="mm")

        draw.text((WIDTH // 2, 270), "How dAssets Works", font=font_hero, fill=TEXT_WHITE, anchor="mm")
        draw.text((WIDTH // 2, 330), "Continuous mathematical hedging with daily 00:00 UTC rebalances", font=font_sub, fill=TEXT_SLATE, anchor="mm")

        # 3 Pillar Pillars
        box_y = 390
        boxes = [
            ("1. Real-Time Feeds", "Binance, Coinbase & Pyth", "Pushed on-chain via 24/7 Keeper daemon on Railway."),
            ("2. Auto-Rebalancing", "Daily 00:00 UTC Reset", "De-leverages on market dumps to eliminate liquidation risk."),
            ("3. Uniswap v3 AMMs", "Concentrated Liquidity", "LPs earn 0.30% swap fees on perpetual arbitrage volume.")
        ]

        by = box_y
        for title, subtitle, desc in boxes:
            draw.rounded_rectangle([140, by, WIDTH - 140, by + 95], radius=16, fill=(13, 16, 22, 220), outline=(255, 255, 255, 25), width=1)
            draw.text((170, by + 18), title, font=font_mono_md, fill=RH_GREEN)
            draw.text((380, by + 18), f"• {subtitle}", font=font_mono_sm, fill=TEXT_WHITE)
            draw.text((170, by + 56), desc, font=font_sub, fill=TEXT_SLATE)
            by += 115

    # SCENE 4 (11.4s - 15.0s / frames 342 - 450): Final Logo Reveal & CTA
    else:
        local_f = f - 342
        p = min(1.0, local_f / 24)
        scale = 0.85 + 0.15 * ease_out_cubic(p)
        
        # Expanding circular shockwaves
        for ring_idx in range(3):
            ring_r = int(120 + ((local_f * 4 + ring_idx * 70) % 240))
            draw.ellipse([WIDTH//2 - ring_r, 380 - ring_r, WIDTH//2 + ring_r, 380 + ring_r], outline=(0, 200, 5, max(0, 70 - ring_r // 3)), width=2)

        # Draw Brand Logo
        if logo_img:
            logo_w = int(220 * scale)
            logo_h = int(220 * scale)
            logo_resized = logo_img.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
            img.alpha_composite(logo_resized, (WIDTH // 2 - logo_w // 2, 380 - logo_h // 2))

        # Brand Headline
        draw.text((WIDTH // 2, 540), "dAssets", font=font_hero, fill=TEXT_WHITE, anchor="mm")
        draw.text((WIDTH // 2, 600), "Leveraged Tokens on Robinhood Chain", font=font_title, fill=RH_GREEN, anchor="mm")
        
        # Contract verified badge
        draw.rounded_rectangle([WIDTH//2 - 200, 640, WIDTH//2 + 200, 682], radius=16, fill=(255, 255, 255, 10), outline=(255, 255, 255, 30), width=1)
        draw.text((WIDTH // 2, 661), "Robinhood Chain Mainnet • 4663", font=font_mono_sm, fill=TEXT_SLATE, anchor="mm")

        # Call to Action URL & Twitter Handle
        draw.text((WIDTH // 2, 750), "dassetsrh.xyz", font=font_title, fill=TEXT_WHITE, anchor="mm")
        draw.text((WIDTH // 2, 800), "Follow @dAssetsRH on X", font=font_mono_md, fill=CYAN_ACCENT, anchor="mm")

    # Bottom Footer on all frames
    draw.line([(60, HEIGHT - 70), (WIDTH - 60, HEIGHT - 70)], fill=(255, 255, 255, 20), width=1)
    draw.text((60, HEIGHT - 50), "270+ Crypto Leveraged Tokens", font=font_mono_sm, fill=TEXT_MUTED)
    draw.text((WIDTH - 60, HEIGHT - 50), "@dAssetsRH", font=font_mono_sm, fill=TEXT_SLATE, anchor="ra")

    return img.convert("RGB")

def main():
    print(f"🎬 Generating Twitter Promo Video ({WIDTH}x{HEIGHT} @ {FPS}fps, {DURATION}s)...")
    
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
    print(f"✓ Video generated successfully: {OUTPUT_FILE}")
    print(f"  File size: {os.path.getsize(OUTPUT_FILE) / 1024:.1f} KB")

if __name__ == "__main__":
    main()
