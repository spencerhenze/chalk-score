using System.ComponentModel.DataAnnotations;

namespace ChalkScore.Api.DTOs;

public record SubmitFeedbackRequest(
    [Required] string Type,
    [Required] string Description,
    string? StepsToReproduce,
    string? Frequency,
    bool? IsNewFeature,
    [Required] string CurrentPage,
    string? ConsoleErrors
);
