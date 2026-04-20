using System.ComponentModel.DataAnnotations;

namespace ChalkScore.Api.DTOs;

public record ExerciseResultInput(
    [Required] Guid ExerciseId,
    [Required] decimal RawValue
);

public record SubmitResultsRequest(
    [Required] List<ExerciseResultInput> Results
);

public record ExerciseResultResponse(
    Guid ExerciseId,
    string ExerciseName,
    string Unit,
    decimal RawValue,
    decimal CalculatedScore,
    decimal Weight,
    string ScoringType,
    decimal MaxValue
);

public record TestEntryResponse(
    Guid Id,
    Guid GymnastId,
    string FirstName,
    string LastName,
    int Level,
    string TestConfigurationName,
    bool IsCompleted,
    decimal? FinalScore,
    List<ExerciseResultResponse> Results
);
