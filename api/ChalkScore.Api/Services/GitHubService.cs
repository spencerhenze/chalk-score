using System.Net.Http.Headers;
using System.Text.Json;
using ChalkScore.Api.Data.Entities;

namespace ChalkScore.Api.Services;

public class GitHubService(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<GitHubService> logger)
{
    private readonly string _token         = config["GitHubIssues:Token"]!;
    private readonly string _owner         = config["GitHubIssues:Owner"]!;
    private readonly string _repo          = config["GitHubIssues:Repo"]!;
    private readonly int    _projectNumber = int.Parse(config["GitHubIssues:ProjectNumber"]!);

    public async Task CreateIssueAsync(FeedbackItem item)
    {
        var client = CreateClient();

        var issueNodeId = await PostIssueAsync(client, item);
        var projectId   = await GetProjectIdAsync(client);
        await AddIssueToProjectAsync(client, projectId, issueNodeId);
    }

    private async Task<string> PostIssueAsync(HttpClient client, FeedbackItem item)
    {
        var label   = item.Type == "Bug" ? "bug" : "enhancement";
        var payload = JsonSerializer.Serialize(new
        {
            title  = BuildTitle(item),
            body   = BuildBody(item),
            labels = new[] { label },
        });

        var response = await client.PostAsync(
            $"https://api.github.com/repos/{_owner}/{_repo}/issues",
            new StringContent(payload, System.Text.Encoding.UTF8, "application/json"));

        await EnsureSuccessOrLogAsync(response, "PostIssue");

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("node_id").GetString()!;
    }

    private async Task<string> GetProjectIdAsync(HttpClient client)
    {
        var payload = JsonSerializer.Serialize(new
        {
            query = $"query {{ user(login: \"{_owner}\") {{ projectV2(number: {_projectNumber}) {{ id }} }} }}"
        });

        var response = await client.PostAsync(
            "https://api.github.com/graphql",
            new StringContent(payload, System.Text.Encoding.UTF8, "application/json"));

        await EnsureSuccessOrLogAsync(response, "GetProjectId");

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement
            .GetProperty("data")
            .GetProperty("user")
            .GetProperty("projectV2")
            .GetProperty("id")
            .GetString()!;
    }

    private async Task AddIssueToProjectAsync(HttpClient client, string projectId, string issueNodeId)
    {
        var payload = JsonSerializer.Serialize(new
        {
            query = $"mutation {{ addProjectV2ItemById(input: {{ projectId: \"{projectId}\", contentId: \"{issueNodeId}\" }}) {{ item {{ id }} }} }}"
        });

        var response = await client.PostAsync(
            "https://api.github.com/graphql",
            new StringContent(payload, System.Text.Encoding.UTF8, "application/json"));

        await EnsureSuccessOrLogAsync(response, "AddIssueToProject");
    }

    private async Task EnsureSuccessOrLogAsync(HttpResponseMessage response, string step)
    {
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            logger.LogError("GitHub API error — {Step}: {StatusCode} {Body}",
                step, (int)response.StatusCode, body);
        }
        response.EnsureSuccessStatusCode();
    }

    private HttpClient CreateClient()
    {
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("ChalkScore-API");
        client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
        client.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");
        return client;
    }

    private static string BuildTitle(FeedbackItem item)
    {
        var prefix = item.Type == "Bug" ? "Bug" : item.IsNewFeature == true ? "Feature" : "Enhancement";
        var description = item.Description.Length > 80
            ? item.Description[..77] + "..."
            : item.Description;
        return $"[{prefix}] {description}";
    }

    private static string BuildBody(FeedbackItem item)
    {
        var lines = new List<string>();

        lines.Add($"**Submitted by:** {item.SubmittedByName} ({item.SubmittedByEmail})");
        lines.Add($"**Environment:** {item.Environment}");
        lines.Add($"**Page:** `{item.CurrentPage}`");
        lines.Add($"**Submitted at:** {item.SubmittedAt:u}");
        lines.Add("");
        lines.Add("## Description");
        lines.Add(item.Description);

        if (item.Type == "Bug")
        {
            if (!string.IsNullOrWhiteSpace(item.StepsToReproduce))
            {
                lines.Add("");
                lines.Add("## Steps to Reproduce");
                lines.Add(item.StepsToReproduce);
            }

            if (!string.IsNullOrWhiteSpace(item.Frequency))
            {
                lines.Add("");
                lines.Add($"**Frequency:** {item.Frequency}");
            }
        }

        if (item.Type == "Feature" && item.IsNewFeature.HasValue)
        {
            lines.Add("");
            lines.Add($"**Request type:** {(item.IsNewFeature.Value ? "New feature" : "Improvement to existing feature")}");
        }

        if (!string.IsNullOrWhiteSpace(item.ConsoleErrors))
        {
            lines.Add("");
            lines.Add("## Console Errors");
            lines.Add("```");
            lines.Add(item.ConsoleErrors);
            lines.Add("```");
        }

        return string.Join("\n", lines);
    }
}
