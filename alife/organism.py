from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Sequence, Tuple
import random

from .grid import Position


@dataclass
class Observation:
    """Observation passed to a policy."""

    position: Position
    local_resources: float
    neighbors: List[Tuple[Position, Dict[str, float]]]
    energy: float
    age: int
    genotype: Sequence[float]


@dataclass
class Organism:
    """Represents an individual with genotype, phenotype, and life-state."""

    id: int
    genotype: List[float]
    position: Position
    energy: float = 10.0
    age: int = 0
    births: int = 0
    policy_name: str = "random"
    metadata: Dict[str, float] = field(default_factory=dict)

    def observation(self, local_resources: float, neighbors: List[Tuple[Position, Dict[str, float]]]) -> Observation:
        return Observation(
            position=self.position,
            local_resources=local_resources,
            neighbors=neighbors,
            energy=self.energy,
            age=self.age,
            genotype=self.genotype,
        )

    def mutate(self, rate: float, sigma: float) -> List[float]:
        mutated = []
        for gene in self.genotype:
            if random.random() < rate:
                mutated.append(gene + random.gauss(0.0, sigma))
            else:
                mutated.append(gene)
        return mutated

    def fitness(self) -> float:
        energy_score = self.energy
        reproduction_score = self.births * 2.0
        longevity_score = max(0.0, 1.0 - 0.01 * self.age)
        return energy_score + reproduction_score + longevity_score
