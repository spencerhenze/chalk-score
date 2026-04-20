namespace ChalkScore.Api.Data.Entities;

public class TestConfiguration
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TestConfigurationExercise> Exercises { get; set; } = [];
}
