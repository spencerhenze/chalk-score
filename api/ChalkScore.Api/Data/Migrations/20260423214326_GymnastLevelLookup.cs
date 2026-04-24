using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ChalkScore.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class GymnastLevelLookup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GymnastLevels",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GymnastLevels", x => x.Id);
                });

            // Seed levels with explicit IDs so existing Gymnast.Level int values (1-10) map correctly.
            migrationBuilder.Sql("""
                INSERT INTO "GymnastLevels" ("Id", "Name", "SortOrder") OVERRIDING SYSTEM VALUE VALUES
                  (1,  '1',        1),
                  (2,  '2',        2),
                  (3,  '3',        3),
                  (4,  '4',        4),
                  (5,  '5',        5),
                  (6,  '6',        6),
                  (7,  '7',        7),
                  (8,  '8',        8),
                  (9,  '9',        9),
                  (10, '10',       10),
                  (11, 'Bronze',   11),
                  (12, 'Silver',   12),
                  (13, 'Gold',     13),
                  (14, 'Platinum', 14),
                  (15, 'Diamond',  15);

                SELECT setval(pg_get_serial_sequence('"GymnastLevels"', 'Id'), 15);
                """);

            // Existing Level int values (1-10) become LevelId FK values — the IDs above are aligned.
            migrationBuilder.RenameColumn(
                name: "Level",
                table: "Gymnasts",
                newName: "LevelId");

            migrationBuilder.CreateIndex(
                name: "IX_Gymnasts_LevelId",
                table: "Gymnasts",
                column: "LevelId");

            migrationBuilder.AddForeignKey(
                name: "FK_Gymnasts_GymnastLevels_LevelId",
                table: "Gymnasts",
                column: "LevelId",
                principalTable: "GymnastLevels",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Gymnasts_GymnastLevels_LevelId",
                table: "Gymnasts");

            migrationBuilder.DropIndex(
                name: "IX_Gymnasts_LevelId",
                table: "Gymnasts");

            migrationBuilder.RenameColumn(
                name: "LevelId",
                table: "Gymnasts",
                newName: "Level");

            migrationBuilder.DropTable(
                name: "GymnastLevels");
        }
    }
}
