using ChalkScore.Api.Data;
using ChalkScore.Api.Data.Entities;
using ChalkScore.Api.DTOs;
using ChalkScore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChalkScore.Api.Controllers;

[ApiController]
[Route("test-types")]
[Authorize]
public class TestTypesController(AppDbContext db, UserSyncService userSync) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (!await IsAdminAsync()) return Forbid();

        var types = await db.TestTypes
            .Include(t => t.Versions)
            .OrderBy(t => t.Name)
            .ToListAsync();

        var response = types.Select(t => new TestTypeResponse(
            t.Id,
            t.Name,
            t.Description,
            t.IsActive,
            t.Versions
                .OrderBy(v => v.Version)
                .Select(v => new TestTypeVersionSummary(
                    v.Id,
                    v.Version,
                    v.IsDraft,
                    v.IsActive,
                    v.Exercises.Count,
                    v.CreatedAt))
                .ToList()
        )).ToList();

        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTestTypeRequest request)
    {
        if (!await IsAdminAsync()) return Forbid();

        var actor = await userSync.SyncAsync(User);

        var testType = new TestType
        {
            Name        = request.Name.Trim(),
            Description = request.Description?.Trim(),
        };

        var config = new TestConfiguration
        {
            TestType        = testType,
            Version         = 1,
            IsDraft         = true,
            CreatedByUserId = actor.Id,
        };

        db.TestTypes.Add(testType);
        db.TestConfigurations.Add(config);
        await db.SaveChangesAsync();

        return Created($"/test-types/{testType.Id}",
            new CreateTestTypeResponse(testType.Id, config.Id, config.Version));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!await IsAdminAsync()) return Forbid();

        var testType = await db.TestTypes
            .Include(t => t.Versions)
                .ThenInclude(v => v.Exercises)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (testType is null) return NotFound();

        if (testType.Versions.Any(v => !v.IsDraft))
            return Conflict(new { error = "Cannot delete a test type that has published versions." });

        db.TestTypes.Remove(testType);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> IsAdminAsync()
    {
        var actor = await userSync.SyncAsync(User);
        return actor.IsAdmin;
    }
}
