using System.ComponentModel.DataAnnotations;

namespace ChalkScore.Api.DTOs;

// Used by the add-gymnast dropdown — published + active only
public record TestConfigurationSummary(
    Guid Id,
    string TestTypeName,
    int Version,
    int ExerciseCount
);

public record TestConfigurationDetail(
    Guid Id,
    Guid TestTypeId,
    string TestTypeName,
    int Version,
    bool IsDraft,
    bool IsActive,
    DateTime CreatedAt,
    List<TestConfigurationExerciseResponse> Exercises
);

public record TestConfigurationExerciseResponse(
    Guid ExerciseId,
    string Name,
    string Unit,
    string MeasurementType,
    string ScoringType,
    decimal MaxValue,
    decimal Weight,
    bool Required,
    int DisplayOrder,
    string? ScoringParams
);

public record CreateTestConfigurationRequest(
    [Required] Guid TestTypeId,
    Guid? CopyFromConfigurationId
);

public record SetExercisesRequest(
    [Required] List<ExerciseConfigInput> Exercises
);

public record ExerciseConfigInput(
    [Required] Guid ExerciseId,
    decimal MaxValue,
    decimal Weight,
    [Required] string ScoringType,
    string? ScoringParams,
    int DisplayOrder,
    bool Required
);

public record PublishResponse(
    Guid Id,
    int Version,
    bool IsDraft,
    bool IsActive
);

public record PatchExerciseRequest(
    decimal? MaxValue,
    decimal? Weight,
    string? ScoringType,
    string? ScoringParams
);

public record PatchExerciseResponse(
    int AffectedSessions,
    int AffectedGymnasts
);
