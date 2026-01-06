from __future__ import annotations

import random
from typing import Dict

from .organism import Observation

Action = Dict[str, object]


class Policy:
    """Abstract policy interface."""

    def act(self, observation: Observation) -> Action:
        raise NotImplementedError


class RandomPolicy(Policy):
    """Simple baseline policy for demos and burn-in."""

    def __init__(self, forage_bias: float = 0.5) -> None:
        self.forage_bias = forage_bias

    def act(self, observation: Observation) -> Action:
        # Prefer foraging if resources are abundant
        if observation.local_resources > 1.0 and random.random() < self.forage_bias:
            return {"type": "forage"}
        choice = random.random()
        if choice < 0.4:
            dx, dy = random.choice([(1, 0), (-1, 0), (0, 1), (0, -1)])
            return {"type": "move", "delta": (dx, dy)}
        if choice < 0.6:
            return {"type": "reproduce"}
        return {"type": "wait"}
