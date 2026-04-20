namespace ChalkScore.Api.DTOs;

public record TestConfigurationSummary(
    Guid Id,
    string Name,
    string? Description,
    int ExerciseCount
);

public record TestConfigurationDetail(
    Guid Id,
    string Name,
    string? Description,
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
