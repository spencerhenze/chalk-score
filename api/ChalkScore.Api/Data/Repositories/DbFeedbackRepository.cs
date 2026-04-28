using ChalkScore.Api.Data.Entities;

namespace ChalkScore.Api.Data.Repositories;

public class DbFeedbackRepository(FeedbackDbContext db) : IFeedbackRepository
{
    public async Task SaveAsync(FeedbackItem item)
    {
        db.FeedbackItems.Add(item);
        await db.SaveChangesAsync();
    }
}
