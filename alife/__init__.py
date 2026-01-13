"""
Core package for a grid-based artificial life simulator.

This package provides modular components to build research-oriented simulations:
GridWorld for environment dynamics, Organism for genotype/phenotype handling,
EvolutionEngine for reproduction and mutation, Scheduler for stepping the world,
and Metrics utilities for instrumentation.
"""

from .grid import Cell, GridWorld, ResourceRegeneration
from .organism import Organism, Observation
from .policy import Policy, RandomPolicy
from .evolution import EvolutionConfig, EvolutionEngine
from .scheduler import Scheduler, SimulationConfig
from .metrics import MetricsSink

__all__ = [
    "Cell",
    "GridWorld",
    "ResourceRegeneration",
    "Organism",
    "Observation",
    "Policy",
    "RandomPolicy",
    "EvolutionConfig",
    "EvolutionEngine",
    "Scheduler",
    "SimulationConfig",
    "MetricsSink",
]
