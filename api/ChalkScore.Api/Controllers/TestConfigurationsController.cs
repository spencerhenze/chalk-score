using ChalkScore.Api.Data;
using ChalkScore.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChalkScore.Api.Controllers;

[ApiController]
[Route("test-configurations")]
[Authorize]
public class TestConfigurationsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var configs = await db.TestConfigurations
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new TestConfigurationSummary(
                c.Id,
                c.Name,
                c.Description,
                c.Exercises.Count
            ))
            .ToListAsync();

        return Ok(configs);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var config = await db.TestConfigurations
            .Include(c => c.Exercises)
                .ThenInclude(e => e.Exercise)
            .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

        if (config is null) return NotFound();

        var detail = new TestConfigurationDetail(
            config.Id,
            config.Name,
            config.Description,
            config.Exercises
                .OrderBy(e => e.DisplayOrder)
                .Select(e => new TestConfigurationExerciseResponse(
                    e.ExerciseId,
                    e.Exercise.Name,
                    e.Exercise.Unit,
                    e.Exercise.MeasurementType.ToString(),
                    e.ScoringType.ToString(),
                    e.MaxValue,
                    e.Weight,
                    e.Required,
                    e.DisplayOrder,
                    e.ScoringParams
                ))
                .ToList()
        );

        return Ok(detail);
    }
}
