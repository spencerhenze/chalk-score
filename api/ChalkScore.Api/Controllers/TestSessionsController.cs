using ChalkScore.Api.Data;
using ChalkScore.Api.Data.Entities;
using ChalkScore.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChalkScore.Api.Controllers;

[ApiController]
[Route("sessions")]
[Authorize]
public class TestSessionsController(AppDbContext db) : ControllerBase
{
    [HttpGet("open")]
    public Task<IActionResult> GetOpen() => GetByStatus(active: true);

    [HttpGet("closed")]
    public Task<IActionResult> GetClosed() => GetByStatus(active: false);

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var session = await db.TestSessions
            .Include(s => s.Gymnasts)
            .FirstOrDefaultAsync(s => s.Id == id);

        return session is null ? NotFound() : Ok(ToResponse(session));
    }

    [HttpPost]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> Create(CreateTestSessionRequest request)
    {
        var session = new TestSession
        {
            Name = request.Name.Trim(),
            Date = request.Date,
        };

        db.TestSessions.Add(session);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = session.Id }, ToResponse(session));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> Update(Guid id, UpdateTestSessionRequest request)
    {
        var session = await db.TestSessions.FindAsync(id);
        if (session is null) return NotFound();
        if (!session.IsActive) return Conflict(new { error = "Cannot rename a closed session." });

        session.Name = request.Name.Trim();
        await db.SaveChangesAsync();
        return Ok(ToResponse(session));
    }

    [HttpPost("{id:guid}/close")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> Close(Guid id)
    {
        var session = await db.TestSessions.FindAsync(id);
        if (session is null) return NotFound();
        if (!session.IsActive) return Conflict(new { error = "Session is already closed." });

        session.IsActive = false;
        await db.SaveChangesAsync();
        return Ok(ToResponse(session));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var session = await db.TestSessions.FindAsync(id);
        if (session is null) return NotFound();

        db.TestSessions.Remove(session);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // --- Gymnasts within a session ---

    [HttpGet("{id:guid}/gymnasts")]
    public async Task<IActionResult> GetGymnasts(Guid id)
    {
        var exists = await db.TestSessions.AnyAsync(s => s.Id == id);
        if (!exists) return NotFound();

        var gymnasts = await db.TestSessionGymnasts
            .Where(tsg => tsg.TestSessionId == id)
            .OrderBy(tsg => tsg.Gymnast.LastName).ThenBy(tsg => tsg.Gymnast.FirstName)
            .Select(tsg => new TestSessionGymnastResponse(
                tsg.Id,
                tsg.GymnastId,
                tsg.Gymnast.FirstName,
                tsg.Gymnast.LastName,
                tsg.Gymnast.Level.Name,
                tsg.TestConfiguration.Name,
                tsg.IsCompleted,
                tsg.FinalScore
            ))
            .ToListAsync();

        return Ok(gymnasts);
    }

    [HttpPost("{id:guid}/gymnasts")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> AddGymnast(Guid id, AddGymnastToSessionRequest request)
    {
        var session = await db.TestSessions.FindAsync(id);
        if (session is null) return NotFound();
        if (!session.IsActive) return Conflict(new { error = "Cannot add gymnasts to a closed session." });

        var alreadyAdded = await db.TestSessionGymnasts
            .AnyAsync(tsg => tsg.TestSessionId == id && tsg.GymnastId == request.GymnastId);
        if (alreadyAdded) return Conflict(new { error = "Gymnast is already in this session." });

        var entry = new TestSessionGymnast
        {
            TestSessionId         = id,
            GymnastId             = request.GymnastId,
            TestConfigurationId   = request.TestConfigurationId,
        };

        db.TestSessionGymnasts.Add(entry);
        await db.SaveChangesAsync();
        return Created($"/sessions/{id}/gymnasts", entry.Id);
    }

    [HttpDelete("{id:guid}/gymnasts/{tsgId:guid}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> RemoveGymnast(Guid id, Guid tsgId)
    {
        var entry = await db.TestSessionGymnasts
            .FirstOrDefaultAsync(tsg => tsg.Id == tsgId && tsg.TestSessionId == id);
        if (entry is null) return NotFound();

        db.TestSessionGymnasts.Remove(entry);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // --- Results summary ---

    [HttpGet("{id:guid}/results")]
    public async Task<IActionResult> GetResults(Guid id)
    {
        var session = await db.TestSessions.FindAsync(id);
        if (session is null) return NotFound();

        var results = await db.TestSessionGymnasts
            .Where(tsg => tsg.TestSessionId == id)
            .OrderBy(tsg => tsg.Gymnast.LastName).ThenBy(tsg => tsg.Gymnast.FirstName)
            .Select(tsg => new SessionGymnastResult(
                tsg.Id,
                tsg.GymnastId,
                tsg.Gymnast.FirstName,
                tsg.Gymnast.LastName,
                tsg.Gymnast.Level.Name,
                tsg.TestConfiguration.Name,
                tsg.IsCompleted,
                tsg.FinalScore
            ))
            .ToListAsync();

        return Ok(new SessionResultsResponse(session.Id, session.Name, session.Date, results));
    }

    // --- Helpers ---

    private async Task<IActionResult> GetByStatus(bool active)
    {
        var sessions = await db.TestSessions
            .Where(s => s.IsActive == active)
            .Include(s => s.Gymnasts)
            .OrderByDescending(s => s.Date)
            .Select(s => ToResponse(s))
            .ToListAsync();

        return Ok(sessions);
    }

    private static TestSessionResponse ToResponse(TestSession s) =>
        new(s.Id, s.Name, s.Date, s.IsActive, s.CreatedAt, s.Gymnasts?.Count ?? 0);
}
