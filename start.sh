#!/bin/bash
# Script to start the Super Scoopers website using the local Node.js

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set up the path to include our local node
export PATH="$SCRIPT_DIR/.tools/node/bin:$PATH"

# Run the dev server
echo "Starting Super Scoopers website..."
npm run dev
