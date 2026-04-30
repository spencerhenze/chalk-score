namespace ChalkScore.Api.Data.Entities;

public class TestConfiguration
{
    public Guid Id { get; set; }
    public Guid TestTypeId { get; set; }
    public int Version { get; set; } = 1;
    public bool IsDraft { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public Guid? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public TestType TestType { get; set; } = null!;
    public ICollection<TestConfigurationExercise> Exercises { get; set; } = [];
}
