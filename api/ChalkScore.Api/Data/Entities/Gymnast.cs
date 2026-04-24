namespace ChalkScore.Api.Data.Entities;

public class Gymnast
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public int LevelId { get; set; }
    public GymnastLevel Level { get; set; } = null!;
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TestSessionGymnast> TestSessionGymnasts { get; set; } = [];
}
