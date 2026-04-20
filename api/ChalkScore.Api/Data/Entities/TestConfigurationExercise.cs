namespace ChalkScore.Api.Data.Entities;

public enum ScoringType { Linear, Percentage, Timed, Tiered, PassFail, Decimal }

public class TestConfigurationExercise
{
    public Guid Id { get; set; }
    public Guid TestConfigurationId { get; set; }
    public Guid ExerciseId { get; set; }
    public decimal MaxValue { get; set; }
    public decimal Weight { get; set; } = 1;
    public ScoringType ScoringType { get; set; }
    public string? ScoringParams { get; set; } // JSON for Tiered thresholds etc.
    public int DisplayOrder { get; set; }
    public bool Required { get; set; } = true;

    public TestConfiguration TestConfiguration { get; set; } = null!;
    public Exercise Exercise { get; set; } = null!;
}
