namespace ChalkScore.Api.Data.Entities;

public enum MeasurementType { Reps, Seconds, Decimal, Boolean, Percentage }

public class Exercise
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public MeasurementType MeasurementType { get; set; }
    public string Unit { get; set; } = null!; // "reps", "seconds", "%", etc.
    public bool IsActive { get; set; } = true;
    public Guid? CreatedByUserId { get; set; }

    public ICollection<TestConfigurationExercise> TestConfigurationExercises { get; set; } = [];
}
