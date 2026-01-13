from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Tuple
import math


Position = Tuple[int, int]


@dataclass
class Cell:
    """Represents a grid cell with terrain, resources, and environment variables."""

    terrain: str = "plain"
    resource: float = 0.0
    environment: Dict[str, float] = field(default_factory=dict)
    occupant: Optional[int] = None  # Organism id occupying the cell


@dataclass
class ResourceRegeneration:
    """
    Configuration for resource regeneration and diffusion.

    Attributes:
        base_rate: baseline regeneration per terrain type.
        seasonal_amplitude: magnitude for seasonal fluctuation.
        period: number of steps to complete a seasonal cycle.
        diffusion_rate: fraction of resource shared with neighbors each step.
        decay: fraction of resource lost per step.
    """

    base_rate: Dict[str, float]
    seasonal_amplitude: float = 0.0
    period: int = 100
    diffusion_rate: float = 0.05
    decay: float = 0.0

    def rate_for(self, terrain: str, step: int) -> float:
        seasonal = 0.0
        if self.seasonal_amplitude:
            seasonal = self.seasonal_amplitude * math.sin(2 * math.pi * step / max(1, self.period))
        return max(0.0, self.base_rate.get(terrain, 0.0) + seasonal)


class GridWorld:
    """
    2D grid world storing terrain, resources, and occupants.

    Supports toroidal boundaries, resource regeneration, diffusion, and environment updates.
    """

    def __init__(
        self,
        width: int,
        height: int,
        terrains: Optional[List[List[str]]] = None,
        torus: bool = True,
        initial_resource: float = 0.0,
    ) -> None:
        self.width = width
        self.height = height
        self.torus = torus
        self.cells: List[List[Cell]] = []
        for y in range(height):
            row: List[Cell] = []
            for x in range(width):
                terrain = terrains[y][x] if terrains else "plain"
                row.append(Cell(terrain=terrain, resource=initial_resource))
            self.cells.append(row)

    def in_bounds(self, pos: Position) -> bool:
        x, y = pos
        return 0 <= x < self.width and 0 <= y < self.height

    def wrap(self, pos: Position) -> Position:
        x, y = pos
        return x % self.width, y % self.height

    def normalize(self, pos: Position) -> Position:
        return self.wrap(pos) if self.torus else pos

    def neighbors(self, pos: Position) -> List[Position]:
        x, y = pos
        candidates = [
            (x + 1, y),
            (x - 1, y),
            (x, y + 1),
            (x, y - 1),
        ]
        result: List[Position] = []
        for nx, ny in candidates:
            wrapped = self.normalize((nx, ny))
            if self.torus or self.in_bounds((nx, ny)):
                result.append(wrapped)
        return result

    def get_cell(self, pos: Position) -> Cell:
        x, y = self.normalize(pos)
        return self.cells[y][x]

    def move_occupant(self, from_pos: Position, to_pos: Position) -> bool:
        src = self.get_cell(from_pos)
        dst = self.get_cell(to_pos)
        if dst.occupant is not None:
            return False
        dst.occupant = src.occupant
        src.occupant = None
        return True

    def set_occupant(self, pos: Position, occupant_id: Optional[int]) -> None:
        cell = self.get_cell(pos)
        cell.occupant = occupant_id

    def regenerate_resources(self, regen: ResourceRegeneration, step: int) -> None:
        for y in range(self.height):
            for x in range(self.width):
                cell = self.cells[y][x]
                cell.resource += regen.rate_for(cell.terrain, step)
                if regen.decay:
                    cell.resource = max(0.0, cell.resource * (1 - regen.decay))

    def diffuse_resources(self, regen: ResourceRegeneration) -> None:
        if regen.diffusion_rate <= 0:
            return
        delta = [[0.0 for _ in range(self.width)] for _ in range(self.height)]
        for y in range(self.height):
            for x in range(self.width):
                cell = self.cells[y][x]
                share = cell.resource * regen.diffusion_rate
                if share <= 0:
                    continue
                neighbors = self.neighbors((x, y))
                if not neighbors:
                    continue
                per_neighbor = share / len(neighbors)
                cell.resource -= share
                for nx, ny in neighbors:
                    delta[ny][nx] += per_neighbor
        for y in range(self.height):
            for x in range(self.width):
                self.cells[y][x].resource += delta[y][x]

    def available_positions(self) -> Iterable[Position]:
        for y in range(self.height):
            for x in range(self.width):
                if self.cells[y][x].occupant is None:
                    yield (x, y)
