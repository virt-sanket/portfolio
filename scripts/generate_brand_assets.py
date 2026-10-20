"""
generate_brand_assets.py
Generates favicon-16x16, favicon-32x32, apple-touch-icon (180x180), favicon.ico,
and a premium, crisp 1200x630 Open Graph (OG) preview image for sanketkandel.com.np.
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ASSETS_DIR = r"c:\website\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

def create_rounded_rect_mask(size, radius):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), size], radius=radius, fill=255)
    return mask

def generate_favicons():
    # Base high-res 512x512
    size = (512, 512)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Gradient background
    bg = Image.new("RGBA", size, (10, 15, 29, 255))
    bg_draw = ImageDraw.Draw(bg)
    for y in range(512):
        r = int(10 + (y / 512) * 5)
        g = int(15 + (y / 512) * -7)
        b = int(29 + (y / 512) * -12)
        bg_draw.line([(0, y), (512, y)], fill=(r, g, b, 255))

    # Mask with rounded corners
    mask = create_rounded_rect_mask(size, 110)
    img.paste(bg, (0, 0), mask)

    # Border gradient
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([(8, 8), (504, 504)], radius=102, outline=(124, 58, 237, 220), width=8)

    # Accent glow circle
    draw.ellipse([(140, 140), (372, 372)], outline=(0, 240, 255, 60), width=4)

    # Text "SK"
    try:
        font = ImageFont.truetype("arialbd.ttf", 220)
    except Exception:
        font = ImageFont.load_default()

    # Draw cyan glow then violet-cyan gradient text
    draw.text((256, 256), "SK", font=font, fill=(0, 240, 255, 240), anchor="mm")
    draw.text((253, 253), "SK", font=font, fill=(168, 85, 247, 255), anchor="mm")

    # Status dot
    draw.ellipse([(380, 100), (416, 136)], fill=(0, 240, 255, 255))

    # Save sizes
    # 180x180 for apple-touch-icon
    apple_icon = img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save(os.path.join(ASSETS_DIR, "apple-touch-icon.png"), "PNG")
    print("Saved apple-touch-icon.png")

    # 32x32 favicon
    fav_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
    fav_32.save(os.path.join(ASSETS_DIR, "favicon-32x32.png"), "PNG")
    print("Saved favicon-32x32.png")

    # 16x16 favicon
    fav_16 = img.resize((16, 16), Image.Resampling.LANCZOS)
    fav_16.save(os.path.join(ASSETS_DIR, "favicon-16x16.png"), "PNG")
    print("Saved favicon-16x16.png")

    # favicon.ico with multiple sizes
    fav_32.save(os.path.join(ASSETS_DIR, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    # Also save to root for root fallback /favicon.ico
    fav_32.save(r"c:\website\favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Saved favicon.ico")


def generate_og_image():
    W, H = 1200, 630
    img = Image.new("RGBA", (W, H), (5, 9, 20, 255))

    # Background ambient lighting
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)

    # Violet orb on top left
    ov_draw.ellipse([(-100, -100), (450, 450)], fill=(124, 58, 237, 70))
    # Cyan orb on bottom right
    ov_draw.ellipse([(850, 250), (1400, 750)], fill=(0, 240, 255, 55))
    # Deep rose subtle glow in center-bottom
    ov_draw.ellipse([(450, 350), (950, 750)], fill=(217, 38, 242, 45))

    overlay = overlay.filter(ImageFilter.GaussianBlur(80))
    img = Image.alpha_composite(img, overlay)

    draw = ImageDraw.Draw(img)

    # Grid pattern subtle overlay
    grid_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grid_overlay)
    step = 50
    for x in range(0, W, step):
        g_draw.line([(x, 0), (x, H)], fill=(255, 255, 255, 8))
    for y in range(0, H, step):
        g_draw.line([(0, y), (W, y)], fill=(255, 255, 255, 8))
    img = Image.alpha_composite(img, grid_overlay)
    draw = ImageDraw.Draw(img)

    # Outer border
    draw.rectangle([(20, 20), (W - 20, H - 20)], outline=(255, 255, 255, 30), width=1)

    # Glassmorphism container
    glass = Image.new("RGBA", (W - 120, H - 120), (255, 255, 255, 12))
    glass_border = ImageDraw.Draw(glass)
    glass_border.rounded_rectangle([(0, 0), (W - 120, H - 120)], radius=28, outline=(255, 255, 255, 45), width=2)
    img.paste(glass, (60, 60), create_rounded_rect_mask((W - 120, H - 120), 28))

    draw = ImageDraw.Draw(img)

    # Fonts
    try:
        font_logo = ImageFont.truetype("arialbd.ttf", 36)
        font_title = ImageFont.truetype("arialbd.ttf", 64)
        font_sub = ImageFont.truetype("arialbd.ttf", 30)
        font_uni = ImageFont.truetype("arial.ttf", 26)
        font_badge = ImageFont.truetype("arialbd.ttf", 20)
        font_tag = ImageFont.truetype("arialbd.ttf", 22)
    except Exception:
        font_logo = font_title = font_sub = font_uni = font_badge = font_tag = ImageFont.load_default()

    # Brand header inside card
    # Monogram badge
    draw.rounded_rectangle([(100, 100), (160, 160)], radius=16, fill=(124, 58, 237, 230), outline=(0, 240, 255, 200), width=2)
    draw.text((130, 130), "SK", font=font_logo, fill=(255, 255, 255, 255), anchor="mm")

    # Domain name badge
    draw.text((180, 120), "sanketkandel.com.np", font=font_sub, fill=(226, 232, 240, 255))
    draw.text((180, 155), "PORTFOLIO & SYSTEM BLUEPRINT", font=ImageFont.truetype("arialbd.ttf", 15), fill=(0, 240, 255, 220))

    # Available badge (top right)
    draw.rounded_rectangle([(W - 400, 105), (W - 100, 155)], radius=24, fill=(15, 23, 42, 220), outline=(16, 185, 129, 200), width=2)
    draw.ellipse([(W - 378, 124), (W - 364, 138)], fill=(16, 185, 129, 255))
    draw.text((W - 245, 130), "AVAILABLE FOR WORK", font=font_badge, fill=(52, 211, 153, 255), anchor="mm")

    # Divider
    draw.line([(100, 185), (W - 100, 185)], fill=(255, 255, 255, 30), width=1)

    # Main Heading: Name
    draw.text((100, 220), "Sanket Kandel", font=font_title, fill=(255, 255, 255, 255))

    # Role Headline
    draw.text((100, 305), "Software Developer & MSc Computer Science Student", font=font_sub, fill=(0, 240, 255, 255))

    # University & Focus
    draw.text((100, 355), "York St John University, United Kingdom", font=font_uni, fill=(168, 85, 247, 255))
    draw.text((100, 395), "Building high-performance web applications, cloud systems & intelligent agents.", font=font_uni, fill=(148, 163, 184, 255))

    # Tech Stack Badges
    tags = ["Python", "Google Cloud", "Supabase", "MongoDB Atlas", "React", "Cloudflare"]
    x_pos = 100
    y_pos = 460
    for tag in tags:
        # compute width
        box = font_tag.getbbox(tag)
        tag_w = (box[2] - box[0]) + 36
        tag_h = 42

        # pill
        draw.rounded_rectangle([(x_pos, y_pos), (x_pos + tag_w, y_pos + tag_h)], radius=21, fill=(15, 23, 42, 230), outline=(124, 58, 237, 180), width=1)
        draw.text((x_pos + tag_w // 2, y_pos + tag_h // 2), tag, font=font_tag, fill=(241, 245, 249, 255), anchor="mm")
        x_pos += tag_w + 16

    # Avatar if exists
    avatar_path = os.path.join(ASSETS_DIR, "avatar.jpg")
    if os.path.exists(avatar_path):
        try:
            av = Image.open(avatar_path).convert("RGBA")
            av_size = 230
            av = av.resize((av_size, av_size), Image.Resampling.LANCZOS)
            av_mask = create_rounded_rect_mask((av_size, av_size), av_size // 2)

            # Circular glow ring
            draw.ellipse([(W - 355, 220), (W - 355 + av_size + 10, 220 + av_size + 10)], outline=(0, 240, 255, 230), width=4)
            img.paste(av, (W - 350, 225), av_mask)
        except Exception as e:
            print("Avatar paste failed:", e)

    # Save og-image.png
    out_path = os.path.join(ASSETS_DIR, "og-image.png")
    img.convert("RGB").save(out_path, "PNG", optimize=True)
    print(f"Saved OG image to {out_path} ({W}x{H})")

if __name__ == "__main__":
    generate_favicons()
    generate_og_image()
