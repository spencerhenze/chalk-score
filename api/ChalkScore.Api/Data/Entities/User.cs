namespace ChalkScore.Api.Data.Entities;

public enum UserRole { Coach = 0, Staff = 1, Pending = 2 }

public class User
{
    public Guid Id { get; set; }
    public string Auth0Id { get; set; } = null!; // Auth0 'sub' claim
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public UserRole Role { get; set; } = UserRole.Staff;
    public bool IsAdmin { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedById { get; set; }
    public User? UpdatedBy { get; set; }
}
