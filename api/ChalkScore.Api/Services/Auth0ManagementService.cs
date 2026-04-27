using System.Net.Http.Headers;
using System.Text.Json;

namespace ChalkScore.Api.Services;

public class Auth0ManagementService(IHttpClientFactory httpClientFactory, IConfiguration config)
{
    private readonly string _domain      = config["Auth0:Domain"]!;
    private readonly string _clientId    = config["Auth0:ManagementClientId"]!;
    private readonly string _clientSecret = config["Auth0:ManagementClientSecret"]!;
    private readonly string _staffRoleId = config["Auth0:StaffRoleId"]!;

    public async Task AssignStaffRoleAsync(string auth0UserId)
    {
        var token = await GetManagementTokenAsync();
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var body = JsonSerializer.Serialize(new { roles = new[] { _staffRoleId } });
        var content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");

        var response = await client.PostAsync(
            $"https://{_domain}/api/v2/users/{Uri.EscapeDataString(auth0UserId)}/roles",
            content);

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
