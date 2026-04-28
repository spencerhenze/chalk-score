using ChalkScore.Api.Data.Entities;

namespace ChalkScore.Api.Data.Repositories;

public interface IFeedbackRepository
{
    Task SaveAsync(FeedbackItem item);
}
