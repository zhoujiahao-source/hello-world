import time

from alife import EvolutionConfig, EvolutionEngine, MetricsSink, Scheduler, SimulationConfig


def main() -> None:
    config = SimulationConfig(width=24, height=24, base_regen={"plain": 0.5})
    evolution = EvolutionEngine(EvolutionConfig(carrying_capacity=150))
    metrics = MetricsSink()
    scheduler = Scheduler(config=config, evolution=evolution, metrics=metrics)
    scheduler.initialize_population(count=40, energy=12.0, genotype_size=10)
    for _ in range(200):
        scheduler.step()
        snapshot = metrics.buffer[-1]
        print(snapshot)
        time.sleep(0.01)


if __name__ == "__main__":
    main()
