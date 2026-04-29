using ChalkScore.Api.Data;
using ChalkScore.Api.Data.Entities;
using ChalkScore.Api.DTOs;
using ChalkScore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChalkScore.Api.Controllers;

[ApiController]
[Route("sessions/{sessionId:guid}/gymnasts/{tsgId:guid}")]
[Authorize]
public class TestResultsController(AppDbContext db) : ControllerBase
{
    // GET /sessions/{sessionId}/gymnasts/{tsgId}
    [HttpGet]
    public async Task<IActionResult> GetEntry(Guid sessionId, Guid tsgId)
    {
        var entry = await LoadEntry(sessionId, tsgId);
        if (entry is null) return NotFound();
        return Ok(await BuildResponse(entry));
    }

    // PUT /sessions/{sessionId}/gymnasts/{tsgId}/results
    // Upserts all exercise results and recalculates scores. Safe to call multiple times.
    [HttpPut("results")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> SubmitResults(Guid sessionId, Guid tsgId, SubmitResultsRequest request)
    {
        var entry = await LoadEntry(sessionId, tsgId);
        if (entry is null) return NotFound();
        if (entry.IsCompleted) return Conflict(new { error = "Test is already completed." });

        // Load exercise configs for this test configuration
        var configs = await db.TestConfigurationExercises
            .Where(c => c.TestConfigurationId == entry.TestConfigurationId)
            .ToListAsync();

        // Load existing results to upsert
        var existing = await db.TestResults
            .Where(r => r.TestSessionGymnastId == tsgId)
            .ToListAsync();

        foreach (var input in request.Results)
        {
            var config = configs.FirstOrDefault(c => c.ExerciseId == input.ExerciseId);
            if (config is null) continue;

            var score = ScoringService.CalculateExerciseScore(input.RawValue, config);

            var result = existing.FirstOrDefault(r => r.ExerciseId == input.ExerciseId);
            if (result is null)
            {
                result = new TestResult
                {
                    TestSessionGymnastId = tsgId,
                    ExerciseId           = input.ExerciseId,
                };
                db.TestResults.Add(result);
            }

            result.RawValue         = input.RawValue;
            result.CalculatedScore  = score;
        }

        await db.SaveChangesAsync();
        return Ok(await BuildResponse(entry));
    }

    // DELETE /sessions/{sessionId}/gymnasts/{tsgId}/results/{exerciseId}
    [HttpDelete("results/{exerciseId:guid}")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> DeleteResult(Guid sessionId, Guid tsgId, Guid exerciseId)
    {
        var entry = await LoadEntry(sessionId, tsgId);
        if (entry is null) return NotFound();
        if (entry.IsCompleted) return Conflict(new { error = "Test is already completed." });

        var result = await db.TestResults
            .FirstOrDefaultAsync(r => r.TestSessionGymnastId == tsgId && r.ExerciseId == exerciseId);

        if (result is not null)
        {
            db.TestResults.Remove(result);
            await db.SaveChangesAsync();
        }

        return NoContent();
    }

    // POST /sessions/{sessionId}/gymnasts/{tsgId}/complete
    // Marks the test as complete and calculates the final score.
    [HttpPost("complete")]
    [Authorize(Policy = "CoachOnly")]
    public async Task<IActionResult> Complete(Guid sessionId, Guid tsgId)
    {
        var entry = await LoadEntry(sessionId, tsgId);
        if (entry is null) return NotFound();
        if (entry.IsCompleted) return Conflict(new { error = "Test is already completed." });

        var configs = await db.TestConfigurationExercises
            .Where(c => c.TestConfigurationId == entry.TestConfigurationId)
            .ToListAsync();

        var results = await db.TestResults
            .Where(r => r.TestSessionGymnastId == tsgId)
            .ToListAsync();

        // Only include required exercises in final score
        var scored = results
            .Join(configs, r => r.ExerciseId, c => c.ExerciseId, (r, c) => (r.CalculatedScore, c.Weight, c.Required))
            .Where(x => x.Required)
            .Select(x => (x.CalculatedScore, x.Weight));

        entry.FinalScore  = ScoringService.CalculateFinalScore(scored);
        entry.IsCompleted = true;

        await db.SaveChangesAsync();
        return Ok(await BuildResponse(entry));
    }

    // --- Helpers ---

    private async Task<TestSessionGymnast?> LoadEntry(Guid sessionId, Guid tsgId) =>
        await db.TestSessionGymnasts
            .FirstOrDefaultAsync(tsg => tsg.Id == tsgId && tsg.TestSessionId == sessionId);

    private async Task<TestEntryResponse> BuildResponse(TestSessionGymnast entry)
    {
        await db.Entry(entry).Reference(e => e.Gymnast).LoadAsync();
        await db.Entry(entry.Gymnast).Reference(g => g.Level).LoadAsync();
        await db.Entry(entry).Reference(e => e.TestConfiguration).LoadAsync();

        var configs = await db.TestConfigurationExercises
            .Include(c => c.Exercise)
            .Where(c => c.TestConfigurationId == entry.TestConfigurationId)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();

        var results = await db.TestResults
            .Where(r => r.TestSessionGymnastId == entry.Id)
            .ToListAsync();

        var exerciseResponses = configs.Select(c =>
        {
            var result = results.FirstOrDefault(r => r.ExerciseId == c.ExerciseId);
            return new ExerciseResultResponse(
                c.ExerciseId,
                c.Exercise.Name,
                c.Exercise.Unit,
                result?.RawValue,
                result?.CalculatedScore,
                c.Weight,
                c.ScoringType.ToString(),
                c.MaxValue
            );
        }).ToList();

        return new TestEntryResponse(
            entry.Id,
            entry.GymnastId,
            entry.Gymnast.FirstName,
            entry.Gymnast.LastName,
            entry.Gymnast.Level.Name,
            entry.TestConfiguration.Name,
            entry.IsCompleted,
            entry.FinalScore,
            exerciseResponses
        );
    }
}
