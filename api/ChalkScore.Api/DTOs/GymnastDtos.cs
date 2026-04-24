using System.ComponentModel.DataAnnotations;

namespace ChalkScore.Api.DTOs;

public record CreateGymnastRequest(
    [Required] string FirstName,
    [Required] string LastName,
    [Required] string Level
);

public record UpdateGymnastRequest(
    [Required] string FirstName,
    [Required] string LastName,
    [Required] string Level,
    string? ImageUrl
);

public record GymnastResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string Level,
    int LevelSortOrder,
    string? ImageUrl,
    DateTime CreatedAt
);

public record ImportGymnastsResponse(
    int Imported,
    int Skipped,
    List<ImportRowError> Errors
);

public record ImportRowError(int Row, string Reason);

public record GymnastHistoryEntry(
    Guid TestSessionGymnastId,
    string SessionName,
    DateOnly SessionDate,
    string TestConfigurationName,
    decimal? FinalScore,
    bool IsCompleted
);
