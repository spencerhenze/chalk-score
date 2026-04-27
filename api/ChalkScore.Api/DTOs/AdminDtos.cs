using System.ComponentModel.DataAnnotations;

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
    string Role,
    bool IsAdmin,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string? UpdatedByName
);

public record UpdateRoleRequest([Required] string Role);
