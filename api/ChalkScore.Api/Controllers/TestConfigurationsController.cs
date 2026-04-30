using ChalkScore.Api.Data;
using ChalkScore.Api.Data.Entities;
using ChalkScore.Api.DTOs;
using ChalkScore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChalkScore.Api.Controllers;

[ApiController]
[Route("test-configurations")]
[Authorize]
public class TestConfigurationsController(AppDbContext db, UserSyncService userSync) : ControllerBase
{
    // GET /test-configurations — published + active only, for add-gymnast dropdown
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var configs = await db.TestConfigurations
            .Where(c => !c.IsDraft && c.IsActive)
            .Include(c => c.TestType)
            .OrderBy(c => c.TestType.Name).ThenBy(c => c.Version)
            .Select(c => new TestConfigurationSummary(
                c.Id,
                c.TestType.Name,
                c.Version,
                c.Exercises.Count
            ))
            .ToListAsync();

        return Ok(configs);
    }

    // GET /test-configurations/{id} — full detail, admin builder use
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (!await IsAdminAsync()) return Forbid();

        var config = await db.TestConfigurations
            .Include(c => c.TestType)
            .Include(c => c.Exercises)
                .ThenInclude(e => e.Exercise)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (config is null) return NotFound();

        return Ok(ToDetail(config));
    }

    // POST /test-configurations — new draft version under an existing TestType
    [HttpPost]
    public async Task<IActionResult> Create(CreateTestConfigurationRequest request)
    {
        if (!await IsAdminAsync()) return Forbid();

        var testType = await db.TestTypes.FindAsync(request.TestTypeId);
        if (testType is null) return NotFound(new { error = "TestType not found." });

        var actor = await userSync.SyncAsync(User);

        var nextVersion = await db.TestConfigurations
            .Where(c => c.TestTypeId == request.TestTypeId)
            .MaxAsync(c => (int?)c.Version) ?? 0;

        var config = new TestConfiguration
        {
            TestTypeId      = request.TestTypeId,
            Version         = nextVersion + 1,
            IsDraft         = true,
            IsActive        = false,
            CreatedByUserId = actor.Id,
        };

        if (request.CopyFromConfigurationId.HasValue)
        {
            var source = await db.TestConfigurations
                .Include(c => c.Exercises)
                .FirstOrDefaultAsync(c => c.Id == request.CopyFromConfigurationId.Value);

            if (source is not null)
            {
                config.Exercises = source.Exercises.Select(e => new TestConfigurationExercise
                {
                    ExerciseId    = e.ExerciseId,
                    MaxValue      = e.MaxValue,
                    Weight        = e.Weight,
                    ScoringType   = e.ScoringType,
                    ScoringParams = e.ScoringParams,
                    DisplayOrder  = e.DisplayOrder,
                    Required      = e.Required,
                }).ToList();
            }
        }

        db.TestConfigurations.Add(config);
        await db.SaveChangesAsync();

        return Created($"/test-configurations/{config.Id}", new
        {
            id         = config.Id,
            testTypeId = config.TestTypeId,
            version    = config.Version,
            isDraft    = config.IsDraft,
        });
    }

    // PUT /test-configurations/{id}/exercises — replace exercise list (draft only)
    [HttpPut("{id:guid}/exercises")]
    public async Task<IActionResult> SetExercises(Guid id, SetExercisesRequest request)
    {
        if (!await IsAdminAsync()) return Forbid();

        var config = await db.TestConfigurations
            .Include(c => c.TestType)
            .Include(c => c.Exercises)
                .ThenInclude(e => e.Exercise)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (config is null) return NotFound();
        if (!config.IsDraft)
            return Conflict(new { error = "Cannot edit exercises on a published configuration. Create a new version instead." });

        db.TestConfigurationExercises.RemoveRange(config.Exercises);

        var newExercises = request.Exercises.Select((e, i) =>
        {
            if (!Enum.TryParse<ScoringType>(e.ScoringType, out var st))
                st = ScoringType.Linear;

            return new TestConfigurationExercise
            {
                TestConfigurationId = id,
                ExerciseId          = e.ExerciseId,
                MaxValue            = e.MaxValue,
                Weight              = e.Weight,
                ScoringType         = st,
                ScoringParams       = e.ScoringParams,
                DisplayOrder        = e.DisplayOrder,
                Required            = e.Required,
            };
        }).ToList();

        db.TestConfigurationExercises.AddRange(newExercises);
        await db.SaveChangesAsync();

        // Reload for response
        await db.Entry(config).Collection(c => c.Exercises).LoadAsync();
        foreach (var ex in config.Exercises)
            await db.Entry(ex).Reference(e => e.Exercise).LoadAsync();

        return Ok(ToDetail(config));
    }

    // PUT /test-configurations/{id}/publish
    [HttpPut("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        if (!await IsAdminAsync()) return Forbid();

        var config = await db.TestConfigurations
            .Include(c => c.Exercises)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (config is null) return NotFound();
        if (!config.IsDraft) return Conflict(new { error = "Configuration is already published." });
        if (!config.Exercises.Any())
            return BadRequest(new { error = "Cannot publish a configuration with no exercises." });

        // Deactivate all sibling versions
        var siblings = await db.TestConfigurations
            .Where(c => c.TestTypeId == config.TestTypeId && c.Id != id)
            .ToListAsync();

        foreach (var s in siblings)
            s.IsActive = false;

        config.IsDraft   = false;
        config.IsActive  = true;

        await db.SaveChangesAsync();

        return Ok(new PublishResponse(config.Id, config.Version, config.IsDraft, config.IsActive));
    }

    // DELETE /test-configurations/{id} — hard delete, draft only
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!await IsAdminAsync()) return Forbid();

        var config = await db.TestConfigurations.FindAsync(id);
        if (config is null) return NotFound();
        if (!config.IsDraft)
            return Conflict(new { error = "Published configurations cannot be deleted." });

        db.TestConfigurations.Remove(config);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // PATCH /test-configurations/{id}/exercises/{exerciseId} — correct scoring params on published
    [HttpPatch("{id:guid}/exercises/{exerciseId:guid}")]
    public async Task<IActionResult> CorrectExercise(Guid id, Guid exerciseId, PatchExerciseRequest request)
    {
        if (!await IsAdminAsync()) return Forbid();

        var config = await db.TestConfigurations
            .Include(c => c.Exercises)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (config is null) return NotFound();
        if (config.IsDraft)
            return Conflict(new { error = "Use PUT /exercises to edit a draft configuration." });

        var configExercise = config.Exercises.FirstOrDefault(e => e.ExerciseId == exerciseId);
        if (configExercise is null) return NotFound();

        if (request.MaxValue.HasValue) configExercise.MaxValue = request.MaxValue.Value;
        if (request.Weight.HasValue)   configExercise.Weight   = request.Weight.Value;
        if (request.ScoringParams is not null) configExercise.ScoringParams = request.ScoringParams;
        if (request.ScoringType is not null && Enum.TryParse<ScoringType>(request.ScoringType, out var st))
            configExercise.ScoringType = st;

        // Find all TSGs using this config
        var tsgIds = await db.TestSessionGymnasts
            .Where(tsg => tsg.TestConfigurationId == id)
            .Select(tsg => tsg.Id)
            .ToListAsync();

        // Recalculate affected exercise scores
        var results = await db.TestResults
            .Where(r => tsgIds.Contains(r.TestSessionGymnastId) && r.ExerciseId == exerciseId)
            .ToListAsync();

        foreach (var result in results)
            result.CalculatedScore = ScoringService.CalculateExerciseScore(result.RawValue, configExercise);

        // Recalculate final scores for completed gymnasts
        var completedTsgs = await db.TestSessionGymnasts
            .Where(tsg => tsgIds.Contains(tsg.Id) && tsg.IsCompleted)
            .ToListAsync();

        var allConfigExercises = config.Exercises.ToList();

        foreach (var tsg in completedTsgs)
        {
            var tsgResults = await db.TestResults
                .Where(r => r.TestSessionGymnastId == tsg.Id)
                .ToListAsync();

            var scored = tsgResults
                .Join(allConfigExercises, r => r.ExerciseId, c => c.ExerciseId,
                    (r, c) => (r.CalculatedScore, c.Weight, c.Required))
                .Where(x => x.Required)
                .Select(x => (x.CalculatedScore, x.Weight));

            tsg.FinalScore = ScoringService.CalculateFinalScore(scored);
        }

        await db.SaveChangesAsync();

        var affectedSessions = tsgIds.Count > 0
            ? await db.TestSessionGymnasts
                .Where(tsg => tsgIds.Contains(tsg.Id))
                .Select(tsg => tsg.TestSessionId)
                .Distinct()
                .CountAsync()
            : 0;

        return Ok(new PatchExerciseResponse(affectedSessions, completedTsgs.Count));
    }

    private static TestConfigurationDetail ToDetail(TestConfiguration config) =>
        new(
            config.Id,
            config.TestTypeId,
            config.TestType.Name,
            config.Version,
            config.IsDraft,
            config.IsActive,
            config.CreatedAt,
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

    private async Task<bool> IsAdminAsync()
    {
        var actor = await userSync.SyncAsync(User);
        return actor.IsAdmin;
    }
}
