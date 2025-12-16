#!/bin/bash
# Remove white background from HeroimagenoBG.png
# Install ImageMagick first: brew install imagemagick

INPUT="/Users/khadijamoti/Projects/Astro/splitdo/public/splitdo/HeroimagenoBG.png"
OUTPUT="/Users/khadijamoti/Projects/Astro/splitdo/public/splitdo/HeroimageTransparent.png"

magick "$INPUT" -fuzz 10% -transparent white "$OUTPUT"

echo "Background removed! Output saved to: $OUTPUT"
