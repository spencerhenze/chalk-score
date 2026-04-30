using System.Net;
using System.Security.Claims;
using System.Text.Json;
using ChalkScore.Api.Data;
using ChalkScore.Api.Data.Entities;

namespace ChalkScore.Api.Middleware;

public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);

            var log = new ChalkScoreLog
            {
                Level = "Error",
                Message = ex.Message,
                ExceptionType = ex.GetType().FullName,
                StackTrace = ex.StackTrace,
                RequestPath = context.Request.Path,
                RequestMethod = context.Request.Method,
                UserId = context.User.FindFirstValue(ClaimTypes.NameIdentifier),
                StatusCode = (int)HttpStatusCode.InternalServerError
            };

            db.ChalkScoreLogs.Add(log);
            await db.SaveChangesAsync();

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            var response = JsonSerializer.Serialize(new { error = "An unexpected error occurred." });
            await context.Response.WriteAsync(response);
        }
    }
}
