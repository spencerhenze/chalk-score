using ChalkScore.Api.Data.Entities;
using System.Text.Json;

namespace ChalkScore.Api.Services;

public static class ScoringService
{
    public static decimal CalculateExerciseScore(decimal rawValue, TestConfigurationExercise config)
    {
        return config.ScoringType switch
        {
            ScoringType.Linear or
            ScoringType.Timed or
            ScoringType.Decimal    => config.MaxValue > 0 ? (rawValue / config.MaxValue) * 100 : 0,
            ScoringType.Percentage => Math.Clamp(rawValue, 0, 100),
            ScoringType.PassFail   => rawValue >= 1 ? 100 : 0,
            ScoringType.Tiered     => CalculateTiered(rawValue, config.ScoringParams),
            _                      => 0
        };
    }

    public static decimal CalculateFinalScore(IEnumerable<(decimal CalculatedScore, decimal Weight)> exerciseScores)
    {
        var scores = exerciseScores.ToList();
        var totalWeight = scores.Sum(e => e.Weight);
        if (totalWeight == 0) return 0;
        return scores.Sum(e => e.CalculatedScore * e.Weight) / totalWeight;
    }

    private static decimal CalculateTiered(decimal rawValue, string? scoringParams)
    {
        if (string.IsNullOrEmpty(scoringParams)) return 0;

        var thresholds = JsonSerializer.Deserialize<List<TieredThreshold>>(scoringParams,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return thresholds?
            .FirstOrDefault(t => rawValue >= t.Min && rawValue <= t.Max)
            ?.Points ?? 0;
    }

    private record TieredThreshold(decimal Min, decimal Max, decimal Points);
}
