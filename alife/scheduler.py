from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple
import random

from .grid import GridWorld, Position, ResourceRegeneration
from .organism import Organism
from .policy import Action, Policy, RandomPolicy
from .evolution import EvolutionConfig, EvolutionEngine
from .metrics import MetricsSink
from .events import EventSystem, drought, bounty, toxic_cleanup


@dataclass
class SimulationConfig:
    width: int = 32
    height: int = 32
    torus: bool = True
    initial_resource: float = 2.0
    base_regen: Dict[str, float] = None
    max_age: int = 500
    metabolism: float = 0.5
    forage_rate: float = 2.0

    def __post_init__(self) -> None:
        if self.base_regen is None:
            self.base_regen = {"plain": 0.4}


class Scheduler:
    """Coordinates environment updates, organism actions, and evolution."""

    def __init__(
        self,
        config: SimulationConfig,
        evolution: Optional[EvolutionEngine] = None,
        regen: Optional[ResourceRegeneration] = None,
        policy_factory=lambda name: RandomPolicy(),
        metrics: Optional[MetricsSink] = None,
        events: Optional[EventSystem] = None,
    ) -> None:
        self.config = config
        self.grid = GridWorld(
            config.width,
            config.height,
            torus=config.torus,
            initial_resource=config.initial_resource,
        )
        self.evolution = evolution or EvolutionEngine(EvolutionConfig())
        self.regen = regen or ResourceRegeneration(base_rate=config.base_regen)
        self.policy_factory = policy_factory
        self.metrics = metrics or MetricsSink()
        self.events = events or EventSystem(events=[drought(), bounty(), toxic_cleanup()])
        self.organisms: Dict[int, Organism] = {}
        self.policies: Dict[str, Policy] = {}
        self.step_count = 0

    def add_organism(self, organism: Organism) -> None:
        self.organisms[organism.id] = organism
        self.grid.set_occupant(organism.position, organism.id)
        if organism.policy_name not in self.policies:
            self.policies[organism.policy_name] = self.policy_factory(organism.policy_name)

    def initialize_population(self, count: int, energy: float = 10.0, genotype_size: int = 8) -> None:
        positions = list(self.grid.available_positions())
        random.shuffle(positions)
        for _ in range(min(count, len(positions))):
            pos = positions.pop()
            genotype = [random.uniform(-1, 1) for _ in range(genotype_size)]
            organism = Organism(
                id=self.evolution.allocate_id(),
                genotype=genotype,
                position=pos,
                energy=energy,
            )
            self.add_organism(organism)

    def step(self) -> None:
        self.grid.regenerate_resources(self.regen, self.step_count)
        self.grid.diffuse_resources(self.regen)
        self.events.run(self.step_count, self.grid, self.organisms)
        self.apply_actions()
        self.apply_metabolism()
        self.cleanup()
        self.organisms = {org.id: org for org in self.evolution.select_survivors(list(self.organisms.values()))}
        self.step_count += 1
        self.metrics.record(self.snapshot())

    def apply_actions(self) -> None:
        for org_id, organism in list(self.organisms.items()):
            cell = self.grid.get_cell(organism.position)
            observation = organism.observation(
                local_resources=cell.resource,
                neighbors=[(pos, {"occupant": self.grid.get_cell(pos).occupant, "resource": self.grid.get_cell(pos).resource}) for pos in self.grid.neighbors(organism.position)],
            )
            policy = self.policies.get(organism.policy_name, RandomPolicy())
            action = policy.act(observation)
            self.resolve_action(organism, action)

    def resolve_action(self, organism: Organism, action: Action) -> None:
        atype = action.get("type")
        if atype == "move":
            delta = action.get("delta", (0, 0))
            self.move(organism, delta)
        elif atype == "forage":
            self.forage(organism)
        elif atype == "reproduce":
            self.reproduce(organism)
        else:
            organism.energy -= 0.1  # small cost to waiting

    def move(self, organism: Organism, delta: Tuple[int, int]) -> None:
        dx, dy = delta
        target = self.grid.normalize((organism.position[0] + dx, organism.position[1] + dy))
        if not self.grid.in_bounds(target) and not self.config.torus:
            return
        if self.grid.move_occupant(organism.position, target):
            organism.position = target
            organism.energy -= 0.3

    def forage(self, organism: Organism) -> None:
        cell = self.grid.get_cell(organism.position)
        gathered = min(self.config.forage_rate, cell.resource)
        cell.resource -= gathered
        organism.energy += gathered

    def reproduce(self, organism: Organism) -> None:
        if not self.evolution.can_reproduce(organism):
            return
        empty_neighbors = [pos for pos in self.grid.neighbors(organism.position) if self.grid.get_cell(pos).occupant is None]
        if not empty_neighbors:
            return
        if not self.evolution.pay_reproduction_cost(organism):
            return
        pos = random.choice(empty_neighbors)
        child = self.evolution.spawn(organism, pos, self.policy_factory(organism.policy_name))
        self.add_organism(child)

    def apply_metabolism(self) -> None:
        for organism in self.organisms.values():
            organism.energy -= self.config.metabolism
            organism.age += 1

    def cleanup(self) -> None:
        dead_ids = [oid for oid, org in self.organisms.items() if org.energy <= 0 or org.age > self.config.max_age]
        for oid in dead_ids:
            pos = self.organisms[oid].position
            self.grid.set_occupant(pos, None)
            del self.organisms[oid]

    def snapshot(self) -> Dict[str, object]:
        return {
            "step": self.step_count,
            "population": len(self.organisms),
            "mean_energy": self._mean([o.energy for o in self.organisms.values()]),
            "mean_age": self._mean([o.age for o in self.organisms.values()]),
        }

    @staticmethod
    def _mean(values: Iterable[float]) -> float:
        items = list(values)
        if not items:
            return 0.0
        return sum(items) / len(items)
