from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Callable
import csv


@dataclass
class MetricsSink:
    """Collects step-level metrics and optionally writes to CSV."""

    buffer: List[Dict[str, object]] = field(default_factory=list)
    writer_factory: Callable[[], csv.DictWriter] | None = None
    _writer: csv.DictWriter | None = field(init=False, default=None)

    def record(self, metrics: Dict[str, object]) -> None:
        self.buffer.append(metrics)
        if self.writer_factory and self._writer is None:
            self._writer = self.writer_factory()
            self._writer.writeheader()
        if self._writer:
            self._writer.writerow(metrics)

    def flush(self) -> None:
        self.buffer.clear()
