#!/bin/bash
# Helper to convert markdown to docx using the mermaid filter

INPUT_FILE="$1"
OUTPUT_FILE="${2:-output.docx}"
SCRIPT_DIR="$(dirname "$0")"

if [ -z "$INPUT_FILE" ]; then
  echo "Usage: $0 <input.md> [output.docx]"
  exit 1
fi

pandoc "$INPUT_FILE" \
  --lua-filter="$SCRIPT_DIR/mermaid-filter.lua" \
  -o "$OUTPUT_FILE"

echo "Converted $INPUT_FILE to $OUTPUT_FILE"
