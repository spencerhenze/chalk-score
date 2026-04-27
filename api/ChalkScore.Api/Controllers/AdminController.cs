using ChalkScore.Api.Data;
using ChalkScore.Api.Data.Entities;
using ChalkScore.Api.DTOs;
using ChalkScore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChalkScore.Api.Controllers;

[ApiController]
[Route("admin")]
[Authorize(Policy = "CoachOnly")]
public class AdminController(AppDbContext db, Auth0ManagementService auth0) : ControllerBase
{
    [HttpGet("pending-users")]
    public async Task<IActionResult> GetPendingUsers()
    {
        var users = await db.Users
            .Where(u => u.Role == UserRole.Pending)
            .OrderBy(u => u.CreatedAt)
            .Select(u => new PendingUserResponse(u.Id, u.Auth0Id, u.FirstName, u.LastName, u.Email, u.CreatedAt))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("users/{id:guid}/approve")]
    public async Task<IActionResult> ApproveUser(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        if (user.Role != UserRole.Pending) return Conflict(new { error = "User is already approved." });

        await auth0.AssignStaffRoleAsync(user.Auth0Id);

        user.Role = UserRole.Staff;
        await db.SaveChangesAsync();

        return Ok();
    }
}
