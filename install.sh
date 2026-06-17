#!/usr/bin/env bash
# AI Website Editor — one-command install for Mac/Linux
# Usage: bash install.sh

echo ""
echo "  ✏  AI Website Editor"
echo "  Open-source visual AI editor for any website"
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "  ERROR: Python 3 not found."
  echo "  Install from https://python.org (3.10+)"
  exit 1
fi

echo "  Python: $(python3 --version)"

# Create venv
if [ ! -d "backend/.venv" ]; then
  echo "  Creating Python environment..."
  python3 -m venv backend/.venv
fi

echo "  Installing dependencies..."
backend/.venv/bin/pip install -r backend/requirements.txt --quiet

echo ""
echo "  ✓ Ready!"
echo ""
echo "  Start the agent:"
echo "    cd backend"
echo "    ../.venv/bin/uvicorn main:app --port 8000"
echo ""
echo "  Then open http://localhost:8000 to get your script tag."
echo ""
