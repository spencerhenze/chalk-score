using System.ComponentModel.DataAnnotations;

namespace ChalkScore.Api.DTOs;

public record TestTypeResponse(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive,
    List<TestTypeVersionSummary> Versions
);

public record TestTypeVersionSummary(
    Guid Id,
    int Version,
    bool IsDraft,
    bool IsActive,
    int ExerciseCount,
    DateTime CreatedAt
);

public record CreateTestTypeRequest(
    [Required] string Name,
    string? Description
);

public record CreateTestTypeResponse(
    Guid TestTypeId,
    Guid ConfigurationId,
    int Version
);
