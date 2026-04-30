using System.ComponentModel.DataAnnotations;

namespace ChalkScore.Api.DTOs;

public record ExerciseResponse(
    Guid Id,
    string Name,
    string? Description,
    string MeasurementType,
    string Unit,
    bool IsActive
);

public record CreateOrUpdateExerciseRequest(
    [Required] string Name,
    string? Description,
    [Required] string MeasurementType,
    [Required] string Unit
);
