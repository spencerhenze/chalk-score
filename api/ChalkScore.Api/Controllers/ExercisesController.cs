using ChalkScore.Api.Data;
using ChalkScore.Api.Data.Entities;
using ChalkScore.Api.DTOs;
using ChalkScore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChalkScore.Api.Controllers;

[ApiController]
[Route("exercises")]
[Authorize]
public class ExercisesController(AppDbContext db, UserSyncService userSync) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (!await IsAdminAsync()) return Forbid();

        var exercises = await db.Exercises
            .OrderBy(e => e.Name)
            .Select(e => new ExerciseResponse(e.Id, e.Name, e.Description, e.MeasurementType.ToString(), e.Unit, e.IsActive))
            .ToListAsync();

        return Ok(exercises);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateOrUpdateExerciseRequest request)
    {
        if (!await IsAdminAsync()) return Forbid();
        if (!Enum.TryParse<MeasurementType>(request.MeasurementType, out var mt))
            return BadRequest(new { error = $"Invalid measurementType '{request.MeasurementType}'." });

        var exercise = new Exercise
        {
            Name            = request.Name.Trim(),
            Description     = request.Description?.Trim(),
            MeasurementType = mt,
            Unit            = request.Unit.Trim(),
        };

        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new ExerciseResponse(
            exercise.Id, exercise.Name, exercise.Description,
            exercise.MeasurementType.ToString(), exercise.Unit, exercise.IsActive));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, CreateOrUpdateExerciseRequest request)
    {
        if (!await IsAdminAsync()) return Forbid();
        if (!Enum.TryParse<MeasurementType>(request.MeasurementType, out var mt))
            return BadRequest(new { error = $"Invalid measurementType '{request.MeasurementType}'." });

        var exercise = await db.Exercises.FindAsync(id);
        if (exercise is null) return NotFound();

        var typeOrUnitChanged = exercise.MeasurementType != mt || exercise.Unit != request.Unit.Trim();
        if (typeOrUnitChanged)
        {
            var usedInPublished = await db.TestConfigurationExercises
                .AnyAsync(e => e.ExerciseId == id && !e.TestConfiguration.IsDraft);
            if (usedInPublished)
                return Conflict(new { error = "Cannot change measurement type or unit — exercise is used in a published test configuration." });
        }

        exercise.Name            = request.Name.Trim();
        exercise.Description     = request.Description?.Trim();
        exercise.MeasurementType = mt;
        exercise.Unit            = request.Unit.Trim();

        await db.SaveChangesAsync();
        return Ok(new ExerciseResponse(exercise.Id, exercise.Name, exercise.Description,
            exercise.MeasurementType.ToString(), exercise.Unit, exercise.IsActive));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!await IsAdminAsync()) return Forbid();

        var exercise = await db.Exercises.FindAsync(id);
        if (exercise is null) return NotFound();

        var usedInAny = await db.TestConfigurationExercises.AnyAsync(e => e.ExerciseId == id);
        if (usedInAny)
            return Conflict(new { error = "Cannot delete exercise — it is used in a test configuration." });

        exercise.IsActive = false;
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> IsAdminAsync()
    {
        var actor = await userSync.SyncAsync(User);
        return actor.IsAdmin;
    }
}
