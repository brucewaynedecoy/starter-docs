set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

check-instruction-routers:
    bash scripts/check-instruction-routers.sh
