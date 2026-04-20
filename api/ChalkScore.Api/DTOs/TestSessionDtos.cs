using System.ComponentModel.DataAnnotations;

namespace ChalkScore.Api.DTOs;

public record CreateTestSessionRequest(
    [Required] string Name,
    [Required] DateOnly Date
);

public record UpdateTestSessionRequest(
    [Required] string Name
);

public record TestSessionResponse(
    Guid Id,
    string Name,
    DateOnly Date,
    bool IsActive,
    DateTime CreatedAt,
    int GymnastCount
);

public record AddGymnastToSessionRequest(
    [Required] Guid GymnastId,
    [Required] Guid TestConfigurationId
);

public record TestSessionGymnastResponse(
    Guid Id,
    Guid GymnastId,
    string FirstName,
    string LastName,
    int Level,
    string TestConfigurationName,
    bool IsCompleted,
    decimal? FinalScore
);
