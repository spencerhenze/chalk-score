using ChalkScore.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChalkScore.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Gymnast> Gymnasts => Set<Gymnast>();
    public DbSet<GymnastLevel> GymnastLevels => Set<GymnastLevel>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<TestType> TestTypes => Set<TestType>();
    public DbSet<TestConfiguration> TestConfigurations => Set<TestConfiguration>();
    public DbSet<TestConfigurationExercise> TestConfigurationExercises => Set<TestConfigurationExercise>();
    public DbSet<TestSession> TestSessions => Set<TestSession>();
    public DbSet<TestSessionGymnast> TestSessionGymnasts => Set<TestSessionGymnast>();
    public DbSet<TestResult> TestResults => Set<TestResult>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<GymnastLevel>()
            .HasMany(l => l.Gymnasts)
            .WithOne(g => g.Level)
            .HasForeignKey(g => g.LevelId);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Auth0Id).IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<User>()
            .HasOne(u => u.UpdatedBy)
            .WithMany()
            .HasForeignKey(u => u.UpdatedById)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<TestConfiguration>()
            .HasOne(c => c.TestType)
            .WithMany(t => t.Versions)
            .HasForeignKey(c => c.TestTypeId);

        modelBuilder.Entity<TestConfigurationExercise>()
            .HasOne(e => e.TestConfiguration)
            .WithMany(tc => tc.Exercises)
            .HasForeignKey(e => e.TestConfigurationId);

        modelBuilder.Entity<TestConfigurationExercise>()
            .HasOne(e => e.Exercise)
            .WithMany(ex => ex.TestConfigurationExercises)
            .HasForeignKey(e => e.ExerciseId);

        modelBuilder.Entity<TestSessionGymnast>()
            .HasOne(tsg => tsg.TestSession)
            .WithMany(ts => ts.Gymnasts)
            .HasForeignKey(tsg => tsg.TestSessionId);

        modelBuilder.Entity<TestSessionGymnast>()
            .HasOne(tsg => tsg.Gymnast)
            .WithMany(g => g.TestSessionGymnasts)
            .HasForeignKey(tsg => tsg.GymnastId);

        modelBuilder.Entity<TestResult>()
            .HasOne(r => r.TestSessionGymnast)
            .WithMany(tsg => tsg.Results)
            .HasForeignKey(r => r.TestSessionGymnastId);
    }
}
