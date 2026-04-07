import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('extension/icons', exist_ok=True)

def create_icon(size):
    img = Image.new('RGBA', (size, size), color=(99, 102, 241, 255)) # Indigo-500
    d = ImageDraw.Draw(img)
    # Simple sparkle symbol or "P"
    text = "P" if size < 48 else "✨"
    
    # Try to calculate a reasonable font size
    try:
        font_size = int(size * 0.7)
        font = ImageFont.truetype("arial.ttf", font_size)
    except IOError:
        font = ImageFont.load_default()
        
    # Get text bounding box for centering
    bbox = d.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    x = (size - text_w) / 2
    y = (size - text_h) / 2 - (size * 0.1) # nudge up slightly
    
    d.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    img.save(f'extension/icons/icon{size}.png')

create_icon(16)
create_icon(48)
create_icon(128)
print("Icons created successfully!")
