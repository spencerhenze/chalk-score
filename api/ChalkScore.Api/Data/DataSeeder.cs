using ChalkScore.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChalkScore.Api.Data;

public static class DataSeeder
{
    // Stable GUIDs so this seeder is idempotent across runs
    private static readonly Guid AdvancedTypeId     = new("30000000-0000-0000-0000-000000000001");
    private static readonly Guid BeginnerTypeId     = new("30000000-0000-0000-0000-000000000002");
    private static readonly Guid AdvancedConfigId   = new("10000000-0000-0000-0000-000000000001");
    private static readonly Guid BeginnerConfigId   = new("10000000-0000-0000-0000-000000000002");

    // Shared exercises
    private static readonly Guid RopeId            = new("20000000-0000-0000-0000-000000000001");
    private static readonly Guid SplitsRightId     = new("20000000-0000-0000-0000-000000000002");
    private static readonly Guid SplitsLeftId      = new("20000000-0000-0000-0000-000000000003");
    private static readonly Guid SplitsMiddleId    = new("20000000-0000-0000-0000-000000000004");
    // Advanced-only exercises
    private static readonly Guid PressHsId         = new("20000000-0000-0000-0000-000000000005");
    private static readonly Guid HandstandHoldId   = new("20000000-0000-0000-0000-000000000006");
    private static readonly Guid LegLiftsId        = new("20000000-0000-0000-0000-000000000007");
    private static readonly Guid HorizLegLiftsId   = new("20000000-0000-0000-0000-000000000008");
    private static readonly Guid CastHsId          = new("20000000-0000-0000-0000-000000000009");
    private static readonly Guid BlockJumpsAdvId   = new("20000000-0000-0000-0000-000000000010");
    private static readonly Guid LeversId          = new("20000000-0000-0000-0000-000000000011");
    private static readonly Guid ArchUps5lbId      = new("20000000-0000-0000-0000-000000000012");
    private static readonly Guid LungeJumpsAdvId   = new("20000000-0000-0000-0000-000000000013");
    // Beginner-only exercises
    private static readonly Guid StalderHoldId     = new("20000000-0000-0000-0000-000000000014");
    private static readonly Guid HhWallId          = new("20000000-0000-0000-0000-000000000015");
    private static readonly Guid LlSlantId         = new("20000000-0000-0000-0000-000000000016");
    private static readonly Guid TuckUpFoamId      = new("20000000-0000-0000-0000-000000000017");
    private static readonly Guid FxBarBallHoldId   = new("20000000-0000-0000-0000-000000000018");
    private static readonly Guid BlockJumpsRedId   = new("20000000-0000-0000-0000-000000000019");
    private static readonly Guid ChinUpPullOversId = new("20000000-0000-0000-0000-000000000020");
    private static readonly Guid ArchUpsRodsTtId   = new("20000000-0000-0000-0000-000000000021");
    private static readonly Guid LungeJumpsBegId   = new("20000000-0000-0000-0000-000000000022");

    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.TestTypes.AnyAsync()) return;

        var exercises = new List<Exercise>
        {
            Ex(RopeId,            "Rope %",                   MeasurementType.Percentage, "%"),
            Ex(SplitsRightId,     "Splits Right",             MeasurementType.Decimal,    ""),
            Ex(SplitsLeftId,      "Splits Left",              MeasurementType.Decimal,    ""),
            Ex(SplitsMiddleId,    "Splits Middle",            MeasurementType.Decimal,    ""),
            // Advanced
            Ex(PressHsId,         "Press Handstand",          MeasurementType.Reps,       "reps"),
            Ex(HandstandHoldId,   "Handstand Hold",           MeasurementType.Seconds,    "sec"),
            Ex(LegLiftsId,        "Leg Lifts",                MeasurementType.Reps,       "reps"),
            Ex(HorizLegLiftsId,   "Horizontal Leg Lifts",     MeasurementType.Reps,       "reps"),
            Ex(CastHsId,          "Cast Handstand",           MeasurementType.Reps,       "reps"),
            Ex(BlockJumpsAdvId,   "Block Jumps",              MeasurementType.Seconds,    "sec"),
            Ex(LeversId,          "Levers",                   MeasurementType.Reps,       "reps"),
            Ex(ArchUps5lbId,      "Arch-Ups 5lb",             MeasurementType.Reps,       "reps"),
            Ex(LungeJumpsAdvId,   "Lunge Jumps",              MeasurementType.Reps,       "reps"),
            // Beginner
            Ex(StalderHoldId,     "Stalder Hold",             MeasurementType.Seconds,    "sec"),
            Ex(HhWallId,          "HH Wall",                  MeasurementType.Seconds,    "sec"),
            Ex(LlSlantId,         "LL Perfect Form Slant",    MeasurementType.Reps,       "reps"),
            Ex(TuckUpFoamId,      "Tuck Up w/ Foam",          MeasurementType.Reps,       "reps"),
            Ex(FxBarBallHoldId,   "FX Bar Ball Hold",         MeasurementType.Seconds,    "sec"),
            Ex(BlockJumpsRedId,   "Block Jumps - Red",        MeasurementType.Reps,       "reps"),
            Ex(ChinUpPullOversId, "Chin Up Pull Overs",       MeasurementType.Reps,       "reps"),
            Ex(ArchUpsRodsTtId,   "Arch-Ups - Rods TT",       MeasurementType.Reps,       "reps"),
            Ex(LungeJumpsBegId,   "Lunge Jumps",              MeasurementType.Reps,       "reps"),
        };

        var advancedType = new TestType
        {
            Id          = AdvancedTypeId,
            Name        = "Advanced",
            Description = "Advanced conditioning test",
        };

        var beginnerType = new TestType
        {
            Id          = BeginnerTypeId,
            Name        = "Beginner",
            Description = "Beginner conditioning test",
        };

        var advanced = new TestConfiguration
        {
            Id         = AdvancedConfigId,
            TestTypeId = AdvancedTypeId,
            Version    = 1,
            IsDraft    = false,
            Exercises  = AdvancedExercises(),
        };

        var beginner = new TestConfiguration
        {
            Id         = BeginnerConfigId,
            TestTypeId = BeginnerTypeId,
            Version    = 1,
            IsDraft    = false,
            Exercises  = BeginnerExercises(),
        };

        db.Exercises.AddRange(exercises);
        db.TestTypes.AddRange(advancedType, beginnerType);
        db.TestConfigurations.AddRange(advanced, beginner);
        await db.SaveChangesAsync();
    }

    private static List<TestConfigurationExercise> AdvancedExercises() =>
    [
        Tce(AdvancedConfigId, PressHsId,        max: 10,  scoring: ScoringType.Linear,     order: 0),
        Tce(AdvancedConfigId, HandstandHoldId,  max: 60,  scoring: ScoringType.Timed,      order: 1),
        Tce(AdvancedConfigId, LegLiftsId,       max: 25,  scoring: ScoringType.Linear,     order: 2),
        Tce(AdvancedConfigId, HorizLegLiftsId,  max: 20,  scoring: ScoringType.Linear,     order: 3),
        Tce(AdvancedConfigId, CastHsId,         max: 10,  scoring: ScoringType.Linear,     order: 4),
        Tce(AdvancedConfigId, RopeId,           max: 100, scoring: ScoringType.Percentage, order: 5),
        Tce(AdvancedConfigId, BlockJumpsAdvId,  max: 60,  scoring: ScoringType.Timed,      order: 6),
        Tce(AdvancedConfigId, LeversId,         max: 15,  scoring: ScoringType.Linear,     order: 7),
        Tce(AdvancedConfigId, ArchUps5lbId,     max: 30,  scoring: ScoringType.Linear,     order: 8),
        Tce(AdvancedConfigId, LungeJumpsAdvId,  max: 40,  scoring: ScoringType.Linear,     order: 9),
        Tce(AdvancedConfigId, SplitsRightId,    max: 5,   scoring: ScoringType.Decimal,    order: 10),
        Tce(AdvancedConfigId, SplitsLeftId,     max: 5,   scoring: ScoringType.Decimal,    order: 11),
        Tce(AdvancedConfigId, SplitsMiddleId,   max: 5,   scoring: ScoringType.Decimal,    order: 12),
    ];

    private static List<TestConfigurationExercise> BeginnerExercises() =>
    [
        Tce(BeginnerConfigId, StalderHoldId,     max: 30,  scoring: ScoringType.Timed,      order: 0),
        Tce(BeginnerConfigId, HhWallId,          max: 90,  scoring: ScoringType.Timed,      order: 1),
        Tce(BeginnerConfigId, LlSlantId,         max: 10,  scoring: ScoringType.Linear,     order: 2),
        Tce(BeginnerConfigId, TuckUpFoamId,      max: 10,  scoring: ScoringType.Linear,     order: 3),
        Tce(BeginnerConfigId, FxBarBallHoldId,   max: 30,  scoring: ScoringType.Timed,      order: 4),
        Tce(BeginnerConfigId, RopeId,            max: 100, scoring: ScoringType.Percentage, order: 5),
        Tce(BeginnerConfigId, BlockJumpsRedId,   max: 50,  scoring: ScoringType.Linear,     order: 6),
        Tce(BeginnerConfigId, ChinUpPullOversId, max: 5,   scoring: ScoringType.Linear,     order: 7),
        Tce(BeginnerConfigId, ArchUpsRodsTtId,   max: 20,  scoring: ScoringType.Linear,     order: 8),
        Tce(BeginnerConfigId, LungeJumpsBegId,   max: 20,  scoring: ScoringType.Linear,     order: 9),
        Tce(BeginnerConfigId, SplitsRightId,     max: 5,   scoring: ScoringType.Decimal,    order: 10),
        Tce(BeginnerConfigId, SplitsLeftId,      max: 5,   scoring: ScoringType.Decimal,    order: 11),
        Tce(BeginnerConfigId, SplitsMiddleId,    max: 5,   scoring: ScoringType.Decimal,    order: 12),
    ];

    private static Exercise Ex(Guid id, string name, MeasurementType type, string unit) =>
        new() { Id = id, Name = name, MeasurementType = type, Unit = unit };

    private static TestConfigurationExercise Tce(
        Guid configId, Guid exerciseId, decimal max, ScoringType scoring, int order) =>
        new()
        {
            TestConfigurationId = configId,
            ExerciseId          = exerciseId,
            MaxValue            = max,
            Weight              = 1,
            ScoringType         = scoring,
            DisplayOrder        = order,
            Required            = true,
        };
}
