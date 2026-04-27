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
public class AdminController(AppDbContext db, Auth0ManagementService auth0, UserSyncService userSync) : ControllerBase
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

    [HttpGet("staff-users")]
    public async Task<IActionResult> GetStaffUsers()
    {
        var users = await db.Users
            .Where(u => u.Role == UserRole.Staff)
            .OrderBy(u => u.LastName).ThenBy(u => u.FirstName)
            .Select(u => new StaffUserResponse(
                u.Id, u.Auth0Id, u.FirstName, u.LastName, u.Email, u.CreatedAt,
                u.UpdatedAt,
                u.UpdatedBy != null ? u.UpdatedBy.FirstName + " " + u.UpdatedBy.LastName : null))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("users/{id:guid}/approve")]
    public async Task<IActionResult> ApproveUser(Guid id)
    {
        var actor = await userSync.SyncAsync(User);
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        if (user.Role != UserRole.Pending) return Conflict(new { error = "User is already approved." });

        await auth0.AssignStaffRoleAsync(user.Auth0Id);

        user.Role = UserRole.Staff;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedById = actor.Id;
        await db.SaveChangesAsync();

        return Ok();
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        if (user.Role != UserRole.Pending) return Conflict(new { error = "Only pending users can be deleted." });

        await auth0.DeleteUserAsync(user.Auth0Id);

        db.Users.Remove(user);
        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("users/{id:guid}/revoke")]
    public async Task<IActionResult> RevokeUser(Guid id)
    {
        var actor = await userSync.SyncAsync(User);
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        if (user.Role != UserRole.Staff) return Conflict(new { error = "User does not have staff access." });

        await auth0.RemoveStaffRoleAsync(user.Auth0Id);

        user.Role = UserRole.Pending;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedById = actor.Id;
        await db.SaveChangesAsync();

        return Ok();
    }
}
