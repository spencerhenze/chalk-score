using ChalkScore.Api.Data;
using ChalkScore.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// PostgreSQL via EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Auth0 JWT bearer auth
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"https://{builder.Configuration["Auth0:Domain"]}/";
        options.Audience = builder.Configuration["Auth0:Audience"];
    });

// Role-based policies using custom Auth0 claim
const string rolesClaim = "https://chalkscore.app/roles";
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CoachOnly", policy =>
        policy.RequireClaim(rolesClaim, "Coach"));
    options.AddPolicy("AnyUser", policy =>
        policy.RequireAuthenticatedUser());
});

builder.Services.AddScoped<UserSyncService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Seed Beginner + Advanced test configurations on first run
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DataSeeder.SeedAsync(db);
}

app.Run();
