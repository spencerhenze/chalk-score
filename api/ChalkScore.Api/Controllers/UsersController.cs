using ChalkScore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChalkScore.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class UsersController(UserSyncService userSync) : ControllerBase
{
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var user = await userSync.SyncAsync(User);
        return Ok(new
        {
            user.Id,
            user.Auth0Id,
            user.FirstName,
            user.LastName,
            user.Email,
            Role = user.Role.ToString(),
            user.IsAdmin,
        });
    }
}
