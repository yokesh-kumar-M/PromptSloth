"""Generate Chrome extension icons from a source image."""
from PIL import Image
import sys
import os

def generate_icons(source_path, output_dir):
    """Generate 16x16, 48x48, and 128x128 icons from source."""
    sizes = [16, 48, 128]
    os.makedirs(output_dir, exist_ok=True)
    
    img = Image.open(source_path)
    # Convert to RGBA if needed
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    for size in sizes:
        resized = img.resize((size, size), Image.LANCZOS)
        output_path = os.path.join(output_dir, f'icon{size}.png')
        resized.save(output_path, 'PNG')
        print(f"Created {output_path} ({size}x{size})")

if __name__ == '__main__':
    source = sys.argv[1] if len(sys.argv) > 1 else 'icon_source.png'
    output = sys.argv[2] if len(sys.argv) > 2 else 'extension-react/public/icons'
    generate_icons(source, output)
    print("Done!")
