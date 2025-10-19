#!/bin/bash
# Copy the icon16.png file to create the other required icon sizes
cd "$(dirname "$0")"
cp icons/icon16.png icons/icon48.png
cp icons/icon16.png icons/icon128.png
echo "Icons created successfully!"
