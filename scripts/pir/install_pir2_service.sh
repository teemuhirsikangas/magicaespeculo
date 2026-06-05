#!/usr/bin/env bash
set -euo pipefail

# Installs pir2 systemd service and user environment file on Raspberry Pi.
# Usage:
#   ./scripts/pir/install_pir2_service.sh
#   ./scripts/pir/install_pir2_service.sh pi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_SRC="$SCRIPT_DIR/pir2.service"
DEBUG_SERVICE_SRC="$SCRIPT_DIR/pir2-debug.service"
ENV_EXAMPLE_SRC="$SCRIPT_DIR/pir2.env.example"

TARGET_USER="${1:-${SUDO_USER:-$USER}}"

if ! id "$TARGET_USER" >/dev/null 2>&1; then
  echo "Error: user '$TARGET_USER' does not exist."
  exit 1
fi

USER_HOME="$(getent passwd "$TARGET_USER" | cut -d: -f6)"
if [[ -z "$USER_HOME" ]]; then
  echo "Error: failed to resolve home directory for '$TARGET_USER'."
  exit 1
fi

ENV_TARGET="$USER_HOME/.config/pir2.env"

if [[ ! -f "$SERVICE_SRC" ]]; then
  echo "Error: missing service file: $SERVICE_SRC"
  exit 1
fi

if [[ ! -f "$DEBUG_SERVICE_SRC" ]]; then
  echo "Error: missing debug service file: $DEBUG_SERVICE_SRC"
  exit 1
fi

if [[ ! -f "$ENV_EXAMPLE_SRC" ]]; then
  echo "Error: missing env template: $ENV_EXAMPLE_SRC"
  exit 1
fi

echo "Installing service from: $SERVICE_SRC"
sudo install -m 0644 "$SERVICE_SRC" /etc/systemd/system/pir2.service
echo "Installing debug service from: $DEBUG_SERVICE_SRC"
sudo install -m 0644 "$DEBUG_SERVICE_SRC" /etc/systemd/system/pir2-debug.service

echo "Preparing environment file for user: $TARGET_USER"
sudo install -d -m 0700 "$USER_HOME/.config"
if [[ ! -f "$ENV_TARGET" ]]; then
  sudo install -m 0600 "$ENV_EXAMPLE_SRC" "$ENV_TARGET"
  sudo chown "$TARGET_USER:$TARGET_USER" "$ENV_TARGET"
  echo "Created: $ENV_TARGET"
else
  echo "Keeping existing file: $ENV_TARGET"
fi

echo "Reloading systemd and enabling service"
sudo systemctl daemon-reload
sudo systemctl enable --now pir2.service

echo "Service status"
sudo systemctl --no-pager --full status pir2.service || true

echo
echo "Done."
echo "If needed, edit env values: $ENV_TARGET"
echo "Then restart with: sudo systemctl restart pir2.service"
echo "To troubleshoot with logs:"
echo "  sudo systemctl disable --now pir2.service"
echo "  sudo systemctl enable --now pir2-debug.service"
echo "  sudo journalctl -u pir2-debug.service -f"
