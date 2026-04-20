namespace ChalkScore.Api.Data.Entities;

public class Gymnast
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public int Level { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TestSessionGymnast> TestSessionGymnasts { get; set; } = [];
}
