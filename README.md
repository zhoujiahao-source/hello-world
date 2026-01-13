# Artificial Life Grid Simulator (prototype)

This repository contains a modular scaffold for a grid-based artificial life simulator suitable for research experiments.

## Features
- Grid world with resource regeneration, diffusion, and scripted events (干旱/丰收/清除过密个体) to stress-test strategies.
- Organisms with genotypes, energy budgets, and simple policies (`act(observation)`) for movement,觅食, 繁殖。
- Evolution engine supporting mutation, reproduction costs, and capacity-aware selection.
- Metrics sink to capture step-level snapshots for later analysis or CSV export.

## Quickstart
1. Install Python 3.10+.
2. Run the demo simulation:
   ```bash
   python examples/run_demo.py
   ```
   You will see per-step snapshots showing population, mean energy, and mean age.

For design details and research-oriented guidance, see `docs/ALife_Grid_Design.md`.
