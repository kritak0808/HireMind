from unittest.mock import AsyncMock

import pytest
from telemetry import DemoDataSeeder


@pytest.mark.asyncio
async def test_demo_data_seeder_execution():
    from unittest.mock import MagicMock
    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    mock_session.flush = AsyncMock()

    # Execute seeder using async session mock
    res = await DemoDataSeeder.seed_all(mock_session)
    assert res["organizations_seeded"] == 5
    assert res["recruiters_seeded"] == 25
    assert res["hiring_managers_seeded"] == 15
    assert res["candidates_seeded"] == 1000
    assert res["jobs_seeded"] == 100
    assert res["applications_seeded"] == 400
    assert res["resumes_seeded"] == 250
    assert res["interviews_seeded"] == 150
    assert res["coding_assessments_seeded"] == 120

    # Ensure flush is called multiple times for each block
    assert mock_session.flush.call_count >= 8
