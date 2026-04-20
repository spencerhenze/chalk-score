namespace ChalkScore.Api.Data.Entities;

public class TestResult
{
    public Guid Id { get; set; }
    public Guid TestSessionGymnastId { get; set; }
    public Guid ExerciseId { get; set; }
    public decimal RawValue { get; set; }
    public decimal CalculatedScore { get; set; } // pre-computed on save

    public TestSessionGymnast TestSessionGymnast { get; set; } = null!;
    public Exercise Exercise { get; set; } = null!;
}
