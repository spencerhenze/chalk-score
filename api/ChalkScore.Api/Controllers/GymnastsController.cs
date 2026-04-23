using ChalkScore.Api.Data;
using ChalkScore.Api.Data.Entities;
using ChalkScore.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChalkScore.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class GymnastsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? sort = "lastName")
    {
        var query = db.Gymnasts.AsQueryable();

        query = sort switch
        {
            "firstName" => query.OrderBy(g => g.FirstName).ThenBy(g => g.LastName),
            "level"     => query.OrderBy(g => g.Level).ThenBy(g => g.LastName),
            _           => query.OrderBy(g => g.LastName).ThenBy(g => g.FirstName),
        };

        var gymnasts = await query.Select(g => ToResponse(g)).ToListAsync();
        return Ok(gymnasts);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var gymnast = await db.Gymnasts.FindAsync(id);
        return gymnast is null ? NotFound() : Ok(ToResponse(gymnast));
    }

    [HttpPost]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> Create(CreateGymnastRequest request)
    {
        var gymnast = new Gymnast
        {
            FirstName = request.FirstName.Trim(),
            LastName  = request.LastName.Trim(),
            Level     = request.Level,
        };

        db.Gymnasts.Add(gymnast);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = gymnast.Id }, ToResponse(gymnast));
    }

    [HttpPost("import")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> Import(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        var errors = new List<ImportRowError>();
        var toInsert = new List<Gymnast>();
        var skipped = 0;

        using var reader = new System.IO.StreamReader(file.OpenReadStream());
        var header = await reader.ReadLineAsync();
        if (header is null) return BadRequest(new { error = "File is empty." });

        // Resolve column indices from header (case-insensitive)
        var cols = header.Split(',').Select(h => h.Trim().ToLowerInvariant()).ToList();
        var firstIdx  = cols.IndexOf("firstname");
        var lastIdx   = cols.IndexOf("lastname");
        var levelIdx  = cols.IndexOf("level");

        if (firstIdx < 0 || lastIdx < 0 || levelIdx < 0)
            return BadRequest(new { error = "CSV must have firstName, lastName, and level columns." });

        var row = 1;
        string? line;
        while ((line = await reader.ReadLineAsync()) is not null)
        {
            row++;
            if (string.IsNullOrWhiteSpace(line)) continue;

            var parts = line.Split(',');
            if (parts.Length <= Math.Max(firstIdx, Math.Max(lastIdx, levelIdx)))
            {
                errors.Add(new ImportRowError(row, "Not enough columns."));
                continue;
            }

            var firstName = parts[firstIdx].Trim();
            var lastName  = parts[lastIdx].Trim();
            var levelStr  = parts[levelIdx].Trim();

            if (string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(lastName))
            {
                errors.Add(new ImportRowError(row, "First and last name are required."));
                continue;
            }

            if (!int.TryParse(levelStr, out var level) || level < 1 || level > 10)
            {
                errors.Add(new ImportRowError(row, $"Level must be a number between 1 and 10."));
                continue;
            }

            var isDuplicate = await db.Gymnasts.AnyAsync(g =>
                g.FirstName == firstName && g.LastName == lastName && g.Level == level);

            if (isDuplicate)
            {
                skipped++;
                continue;
            }

            toInsert.Add(new Gymnast { FirstName = firstName, LastName = lastName, Level = level });
        }

        db.Gymnasts.AddRange(toInsert);
        await db.SaveChangesAsync();

        return Ok(new ImportGymnastsResponse(toInsert.Count, skipped, errors));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> Update(Guid id, UpdateGymnastRequest request)
    {
        var gymnast = await db.Gymnasts.FindAsync(id);
        if (gymnast is null) return NotFound();

        gymnast.FirstName = request.FirstName.Trim();
        gymnast.LastName  = request.LastName.Trim();
        gymnast.Level     = request.Level;
        gymnast.ImageUrl  = request.ImageUrl;

        await db.SaveChangesAsync();
        return Ok(ToResponse(gymnast));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var gymnast = await db.Gymnasts.FindAsync(id);
        if (gymnast is null) return NotFound();

        db.Gymnasts.Remove(gymnast);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/history")]
    public async Task<IActionResult> GetHistory(Guid id, [FromQuery] int limit = 12)
    {
        var exists = await db.Gymnasts.AnyAsync(g => g.Id == id);
        if (!exists) return NotFound();

        var history = await db.TestSessionGymnasts
            .Where(tsg => tsg.GymnastId == id && tsg.IsCompleted)
            .OrderByDescending(tsg => tsg.TestSession.Date)
            .Take(limit)
            .Select(tsg => new GymnastHistoryEntry(
                tsg.Id,
                tsg.TestSession.Name,
                tsg.TestSession.Date,
                tsg.TestConfiguration.Name,
                tsg.FinalScore,
                tsg.IsCompleted
            ))
            .ToListAsync();

        return Ok(history);
    }

    private static GymnastResponse ToResponse(Gymnast g) =>
        new(g.Id, g.FirstName, g.LastName, g.Level, g.ImageUrl, g.CreatedAt);
}
