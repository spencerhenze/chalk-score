using ChalkScore.Api.Data;
using ChalkScore.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ChalkScore.Api.Services;

public class UserSyncService(AppDbContext db)
{
    private const string RoleClaimType       = "https://chalkscore.app/roles";
    private const string EmailClaimType      = "https://chalkscore.app/email";
    private const string GivenNameClaimType  = "https://chalkscore.app/given_name";
    private const string FamilyNameClaimType = "https://chalkscore.app/family_name";

    public async Task<User> SyncAsync(ClaimsPrincipal principal)
    {
        var auth0Id = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("sub")
            ?? throw new InvalidOperationException("No sub claim found in token.");

        var user = await db.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);

        if (user is null)
        {
            user = new User
            {
                Auth0Id   = auth0Id,
                Email     = principal.FindFirstValue(EmailClaimType) ?? "",
                FirstName = principal.FindFirstValue(GivenNameClaimType) ?? "",
                LastName  = principal.FindFirstValue(FamilyNameClaimType) ?? "",
                Role      = ResolveRole(principal),
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        return user;
    }

    private static UserRole ResolveRole(ClaimsPrincipal principal)
    {
        var roles = principal.FindAll(RoleClaimType).Select(c => c.Value);
        return roles.Contains("Coach") ? UserRole.Coach : UserRole.Staff;
    }
}
