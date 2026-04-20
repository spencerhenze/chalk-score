namespace ChalkScore.Api.Data.Entities;

public class TestSessionGymnast
{
    public Guid Id { get; set; }
    public Guid TestSessionId { get; set; }
    public Guid GymnastId { get; set; }
    public Guid TestConfigurationId { get; set; }
    public bool IsCompleted { get; set; } = false;
    public decimal? FinalScore { get; set; }

    public TestSession TestSession { get; set; } = null!;
    public Gymnast Gymnast { get; set; } = null!;
    public TestConfiguration TestConfiguration { get; set; } = null!;
    public ICollection<TestResult> Results { get; set; } = [];
}
