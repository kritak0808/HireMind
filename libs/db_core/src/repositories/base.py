from typing import List, Optional, Protocol, TypeVar
from uuid import UUID

T = TypeVar("T")

class BaseRepository(Protocol[T]):
    """Generic Protocol representing database operation interface boundaries."""
    async def get_by_id(self, id: UUID) -> Optional[T]:
        ...

    async def add(self, entity: T) -> None:
        ...

    async def delete(self, entity: T) -> None:
        ...

    async def list_all(self) -> List[T]:
        ...

    async def save(self) -> None:
        ...
