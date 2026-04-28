namespace ChalkScore.Api.Data.Entities;

public class FeedbackItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public string SubmittedByAuth0Id { get; set; } = null!;
    public string SubmittedByName { get; set; } = null!;
    public string SubmittedByEmail { get; set; } = null!;
    public string Type { get; set; } = null!;           // "Bug" | "Feature"
    public string Description { get; set; } = null!;
    public string? StepsToReproduce { get; set; }
    public string? Frequency { get; set; }              // "EveryTime" | "Intermittent"
    public bool? IsNewFeature { get; set; }
    public string CurrentPage { get; set; } = null!;
    public string? ConsoleErrors { get; set; }
    public string Environment { get; set; } = null!;
}
