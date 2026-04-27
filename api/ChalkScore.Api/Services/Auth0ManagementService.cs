using System.Net.Http.Headers;
using System.Text.Json;
using ChalkScore.Api.Data.Entities;

namespace ChalkScore.Api.Services;

public class Auth0ManagementService(IHttpClientFactory httpClientFactory, IConfiguration config)
{
    private readonly string _domain       = config["Auth0:Domain"]!;
    private readonly string _clientId     = config["Auth0:ManagementClientId"]!;
    private readonly string _clientSecret = config["Auth0:ManagementClientSecret"]!;
    private readonly string _staffRoleId  = config["Auth0:StaffRoleId"]!;
    private readonly string _coachRoleId  = config["Auth0:CoachRoleId"]!;

    public async Task AssignStaffRoleAsync(string auth0UserId) =>
        await SendRoleRequestAsync(HttpMethod.Post, auth0UserId, _staffRoleId);

    public async Task RemoveStaffRoleAsync(string auth0UserId) =>
        await SendRoleRequestAsync(HttpMethod.Delete, auth0UserId, _staffRoleId);

    public async Task AssignCoachRoleAsync(string auth0UserId) =>
        await SendRoleRequestAsync(HttpMethod.Post, auth0UserId, _coachRoleId);

    public async Task RemoveCoachRoleAsync(string auth0UserId) =>
        await SendRoleRequestAsync(HttpMethod.Delete, auth0UserId, _coachRoleId);

    public async Task ChangeRoleAsync(string auth0UserId, UserRole from, UserRole to)
    {
        var token = await GetManagementTokenAsync();
        var removeId = from == UserRole.Coach ? _coachRoleId : _staffRoleId;
        var assignId = to  == UserRole.Coach ? _coachRoleId : _staffRoleId;
        await SendRoleRequestAsync(HttpMethod.Delete, auth0UserId, removeId, token);
        await SendRoleRequestAsync(HttpMethod.Post,   auth0UserId, assignId, token);
    }

    public async Task DeleteUserAsync(string auth0UserId)
    {
        var token = await GetManagementTokenAsync();
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.DeleteAsync(
            $"https://{_domain}/api/v2/users/{Uri.EscapeDataString(auth0UserId)}");

        response.EnsureSuccessStatusCode();
    }

    private async Task SendRoleRequestAsync(HttpMethod method, string auth0UserId, string roleId, string? token = null)
    {
        token ??= await GetManagementTokenAsync();
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var body = JsonSerializer.Serialize(new { roles = new[] { roleId } });
        var request = new HttpRequestMessage(method, $"https://{_domain}/api/v2/users/{Uri.EscapeDataString(auth0UserId)}/roles")
        {
            Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json"),
        };

        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }

    private async Task<string> GetManagementTokenAsync()
    {
        var client = httpClientFactory.CreateClient();

        var body = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"]    = "client_credentials",
            ["client_id"]     = _clientId,
            ["client_secret"] = _clientSecret,
            ["audience"]      = $"https://{_domain}/api/v2/",
        });

        var response = await client.PostAsync($"https://{_domain}/oauth/token", body);
        response.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("access_token").GetString()!;
    }
}
