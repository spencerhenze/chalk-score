namespace ChalkScore.Api.DTOs;

public record PendingUserResponse(
    Guid Id,
    string Auth0Id,
    string FirstName,
    string LastName,
    string Email,
    DateTime CreatedAt
);

public record StaffUserResponse(
    Guid Id,
    string Auth0Id,
    string FirstName,
    string LastName,
    string Email,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string? UpdatedByName
);
