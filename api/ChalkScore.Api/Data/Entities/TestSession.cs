namespace ChalkScore.Api.Data.Entities;

public class TestSession
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public DateOnly Date { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TestSessionGymnast> Gymnasts { get; set; } = [];
}
