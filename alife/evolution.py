from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Sequence
import random

from .organism import Organism
from .policy import Policy


@dataclass
class EvolutionConfig:
    mutation_rate: float = 0.01
    mutation_sigma: float = 0.05
    reproduction_cost: float = 4.0
    min_reproduction_energy: float = 8.0
    carrying_capacity: int = 200


class EvolutionEngine:
    """Handles reproduction, mutation, and selection."""

    def __init__(self, config: EvolutionConfig) -> None:
        self.config = config
        self.next_id = 0

    def spawn(
        self,
        parent: Organism,
        position,
        policy: Policy,
    ) -> Organism:
        genotype = parent.mutate(self.config.mutation_rate, self.config.mutation_sigma)
        child = Organism(
            id=self.allocate_id(),
            genotype=genotype,
            position=position,
            energy=max(2.0, parent.energy / 2),
            policy_name=parent.policy_name,
        )
        return child

    def allocate_id(self) -> int:
        oid = self.next_id
        self.next_id += 1
        return oid

    def select_survivors(self, organisms: List[Organism]) -> List[Organism]:
        if len(organisms) <= self.config.carrying_capacity:
            return organisms
        # Soft selection based on fitness-proportional sampling
        weights = [max(0.001, org.fitness()) for org in organisms]
        survivors = random.choices(organisms, weights=weights, k=self.config.carrying_capacity)
        return survivors

    def can_reproduce(self, organism: Organism) -> bool:
        return organism.energy >= self.config.min_reproduction_energy

    def pay_reproduction_cost(self, organism: Organism) -> bool:
        if organism.energy < self.config.reproduction_cost:
            return False
        organism.energy -= self.config.reproduction_cost
        organism.births += 1
        return True
