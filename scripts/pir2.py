#!/usr/bin/python3
"""Reliable PIR motion monitor control for Raspberry Pi. (By Ai)

Usage example (crontab):
@reboot sleep 20 && /usr/bin/python3 /home/pi/magicaespeculo/scripts/pir2.py
"""

import signal
import subprocess
import sys
import time
from typing import List

import RPi.GPIO as GPIO

# PIR and timing configuration
PIR_PIN = 8  # BCM numbering
MOTION_HOLDOFF_SECONDS = 2.0       # Ignore repeated triggers inside this window
MONITOR_OFF_DELAY_SECONDS = 60.0  # Turn monitor off after this much inactivity
STARTUP_WARMUP_SECONDS = 25.0      # PIR sensors need warmup on boot
POLL_INTERVAL_SECONDS = 0.2         # Poll in addition to GPIO interrupt for reliability
MIN_ON_SECONDS = 10.0              # Keep monitor on at least this long after turn-on
HEARTBEAT_SECONDS = 30.0           # Emit periodic status logs
ACTIVITY_LOG_COOLDOWN_SECONDS = 3.0  # Limit motion log spam when PIR stays HIGH

# Display output name for Wayland setup
WAYLAND_OUTPUT = "HDMI-A-1"

running = True
turned_off = False
last_motion_time = 0.0
last_on_time = 0.0


class MonitorController:
    """Try multiple monitor power methods for better compatibility."""

    def __init__(self, output_name: str) -> None:
        self.output_name = output_name

    def _run(self, cmd: List[str]) -> bool:
        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=3,
                check=False,
            )
            return result.returncode == 0
        except (subprocess.SubprocessError, FileNotFoundError):
            return False

    def power_on(self) -> bool:
        methods = [
            ["wlr-randr", "--output", self.output_name, "--on"],
            ["vcgencmd", "display_power", "1"],
            ["xset", "-display", ":0", "dpms", "force", "on"],
        ]
        return self._try_methods(methods)

    def power_off(self) -> bool:
        methods = [
            ["wlr-randr", "--output", self.output_name, "--off"],
            ["vcgencmd", "display_power", "0"],
            ["xset", "-display", ":0", "dpms", "force", "off"],
        ]
        return self._try_methods(methods)

    def _try_methods(self, methods: List[List[str]]) -> bool:
        # Retry to tolerate transient compositor/display-manager timing issues.
        for _ in range(3):
            for cmd in methods:
                if self._run(cmd):
                    return True
            time.sleep(0.25)
        return False


def log(msg: str) -> None:
    stamp = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{stamp}] {msg}", flush=True)


def stop_handler(signum, frame) -> None:  # type: ignore[no-untyped-def]
    global running
    running = False
    log(f"Received signal {signum}, stopping")


def mark_motion(controller: MonitorController) -> None:
    global last_motion_time
    global last_on_time
    global turned_off

    now = time.time()
    if now - last_motion_time < MOTION_HOLDOFF_SECONDS:
        return

    last_motion_time = now
    if turned_off:
        if controller.power_on():
            turned_off = False
            last_on_time = now
            log("Motion detected -> monitor ON")
        else:
            log("Motion detected but failed to turn monitor ON")


def gpio_callback(_channel: int) -> None:
    # Keep callback tiny and non-blocking; state changes happen in main loop.
    pass


def setup_gpio() -> None:
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)

    # Best effort cleanup if a previous crashed process left state behind.
    try:
        GPIO.cleanup()
    except RuntimeError:
        pass

    # cleanup() can clear the selected numbering mode in some RPi.GPIO versions.
    GPIO.setmode(GPIO.BCM)

    GPIO.setup(PIR_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
    GPIO.add_event_detect(PIR_PIN, GPIO.BOTH, callback=gpio_callback, bouncetime=250)


def main() -> int:
    global turned_off
    global last_motion_time
    global last_on_time

    controller = MonitorController(WAYLAND_OUTPUT)

    signal.signal(signal.SIGINT, stop_handler)
    signal.signal(signal.SIGTERM, stop_handler)

    try:
        setup_gpio()
    except Exception as exc:
        log(f"GPIO setup failed: {exc}")
        log("Tip: stop old copies of this script and verify PIR pin is not used elsewhere")
        return 1

    log("Starting PIR monitor controller")
    log(f"Warming up sensor for {STARTUP_WARMUP_SECONDS:.0f}s")
    time.sleep(STARTUP_WARMUP_SECONDS)

    # Start in ON state so user can see the screen immediately after boot.
    if controller.power_on():
        turned_off = False
        last_on_time = time.time()
        log("Monitor ON at startup")
    else:
        log("Startup monitor ON command failed; continuing")

    last_motion_time = time.time()
    last_pir_state = GPIO.LOW
    last_activity_log_time = 0.0
    last_heartbeat_time = time.time()

    try:
        while running:
            now = time.time()
            pir_state = GPIO.input(PIR_PIN)

            if pir_state != last_pir_state:
                if pir_state == GPIO.HIGH:
                    log("PIR state HIGH (motion signal)")
                else:
                    log("PIR state LOW (idle)")
                last_pir_state = pir_state

            if pir_state == GPIO.HIGH:
                if now - last_activity_log_time >= ACTIVITY_LOG_COOLDOWN_SECONDS:
                    log("Motion activity detected")
                    last_activity_log_time = now
                mark_motion(controller)

            inactivity = now - last_motion_time
            on_for = now - last_on_time

            if now - last_heartbeat_time >= HEARTBEAT_SECONDS:
                monitor_state = "OFF" if turned_off else "ON"
                pir_label = "HIGH" if pir_state == GPIO.HIGH else "LOW"
                log(
                    f"Heartbeat: monitor={monitor_state}, pir={pir_label}, "
                    f"inactivity={int(inactivity)}s"
                )
                last_heartbeat_time = now

            if not turned_off and inactivity >= MONITOR_OFF_DELAY_SECONDS and on_for >= MIN_ON_SECONDS:
                if controller.power_off():
                    turned_off = True
                    log("No motion -> monitor OFF")
                else:
                    # Avoid tight retry loop if command keeps failing.
                    last_motion_time = now
                    log("Failed to turn monitor OFF; will retry later")

            time.sleep(POLL_INTERVAL_SECONDS)

    finally:
        try:
            GPIO.remove_event_detect(PIR_PIN)
        except RuntimeError:
            pass
        GPIO.cleanup()
        log("GPIO cleaned up")

    return 0


if __name__ == "__main__":
    sys.exit(main())
