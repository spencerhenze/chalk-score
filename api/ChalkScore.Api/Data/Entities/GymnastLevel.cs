namespace ChalkScore.Api.Data.Entities;

public class GymnastLevel
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int SortOrder { get; set; }

    public ICollection<Gymnast> Gymnasts { get; set; } = [];
}
