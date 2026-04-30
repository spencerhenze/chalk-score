namespace ChalkScore.Api.DTOs;

public record SessionResultsResponse(
    Guid SessionId,
    string SessionName,
    DateOnly Date,
    List<SessionGymnastResult> Results
);

public record SessionGymnastResult(
    Guid TestSessionGymnastId,
    Guid GymnastId,
    string FirstName,
    string LastName,
    string Level,
    string TestConfigurationName,
    int TestVersion,
    bool IsCompleted,
    decimal? FinalScore
);
