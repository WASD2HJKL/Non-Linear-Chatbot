#!/bin/bash
set -e

# Install wasp
echo "Installing wasp..."
curl -sSL https://get.wasp-lang.dev/installer.sh | sh

# Install Zim framework
echo "Installing Zim framework..."
curl -fsSL https://raw.githubusercontent.com/zimfw/install/master/install.zsh | zsh

# Download and setup .zshrc
echo "Setting up .zshrc..."
curl -fsSL https://raw.githubusercontent.com/HongzhengL/dotfile/main/.zshrc -o ~/.zshrc

echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> ~/.zshrc
echo "zsh" >> ~/.bashrc

# Source the new configuration
echo "Sourcing .zshrc..."
source ~/.zshrc || true

echo "Setup complete!"
