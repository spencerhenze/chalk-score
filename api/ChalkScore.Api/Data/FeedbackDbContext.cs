using ChalkScore.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChalkScore.Api.Data;

public class FeedbackDbContext(DbContextOptions<FeedbackDbContext> options) : DbContext(options)
{
    public DbSet<FeedbackItem> FeedbackItems => Set<FeedbackItem>();
}
