from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, Iterable, List
import random

from .grid import GridWorld
from .organism import Organism


EventFn = Callable[[GridWorld, Dict[int, Organism]], None]


@dataclass
class TimedEvent:
    """Describes an event triggered by step number."""

    name: str
    trigger: Callable[[int], bool]
    effect: EventFn


class EventSystem:
    """Manages scripted or stochastic events."""

    def __init__(self, events: Iterable[TimedEvent] | None = None) -> None:
        self.events: List[TimedEvent] = list(events) if events else []

    def add(self, event: TimedEvent) -> None:
        self.events.append(event)

    def run(self, step: int, grid: GridWorld, organisms: Dict[int, Organism]) -> None:
        for event in self.events:
            if event.trigger(step):
                event.effect(grid, organisms)


def drought(intensity: float = 0.2) -> TimedEvent:
    def effect(grid: GridWorld, organisms: Dict[int, Organism]) -> None:
        for row in grid.cells:
            for cell in row:
                cell.resource = max(0.0, cell.resource * (1 - intensity))

    return TimedEvent(
        name="drought",
        trigger=lambda step: step % 500 == 0 and step > 0,
        effect=effect,
    )


def bounty(boost: float = 1.0) -> TimedEvent:
    def effect(grid: GridWorld, organisms: Dict[int, Organism]) -> None:
        for row in grid.cells:
            for cell in row:
                cell.resource += boost

    return TimedEvent(
        name="bounty",
        trigger=lambda step: step % 500 == 250,
        effect=effect,
    )


def toxic_cleanup(probability: float = 0.1) -> TimedEvent:
    def effect(grid: GridWorld, organisms: Dict[int, Organism]) -> None:
        to_remove = [oid for oid, org in organisms.items() if random.random() < probability]
        for oid in to_remove:
            pos = organisms[oid].position
            grid.set_occupant(pos, None)
            del organisms[oid]

    return TimedEvent(
        name="toxic_cleanup",
        trigger=lambda step: step > 0 and step % 1000 == 0,
        effect=effect,
    )
