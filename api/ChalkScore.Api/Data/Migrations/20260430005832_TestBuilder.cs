using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChalkScore.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class TestBuilder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: add new columns (keep Name/Description for now — needed for backfill)
            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                table: "TestConfigurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TestTypeId",
                table: "TestConfigurations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "TestConfigurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Step 2: create TestTypes table
            migrationBuilder.CreateTable(
                name: "TestTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestTypes", x => x.Id);
                });

            // Step 3: backfill — one TestType per existing configuration, using the old Name column
            migrationBuilder.Sql(@"
                INSERT INTO ""TestTypes"" (""Id"", ""Name"", ""Description"", ""IsActive"", ""CreatedAt"")
                SELECT gen_random_uuid(), tc.""Name"", tc.""Description"", true, NOW()
                FROM ""TestConfigurations"" tc;

                UPDATE ""TestConfigurations"" tc
                SET ""TestTypeId"" = tt.""Id"", ""Version"" = 1, ""IsDraft"" = false
                FROM ""TestTypes"" tt
                WHERE tt.""Name"" = tc.""Name"";
            ");

            // Step 4: add FK and index now that all rows are linked
            migrationBuilder.CreateIndex(
                name: "IX_TestConfigurations_TestTypeId",
                table: "TestConfigurations",
                column: "TestTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_TestConfigurations_TestTypes_TestTypeId",
                table: "TestConfigurations",
                column: "TestTypeId",
                principalTable: "TestTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // Step 5: drop old columns now that they've been migrated to TestTypes
            migrationBuilder.DropColumn(
                name: "Description",
                table: "TestConfigurations");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "TestConfigurations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TestConfigurations_TestTypes_TestTypeId",
                table: "TestConfigurations");

            migrationBuilder.DropTable(
                name: "TestTypes");

            migrationBuilder.DropIndex(
                name: "IX_TestConfigurations_TestTypeId",
                table: "TestConfigurations");

            migrationBuilder.DropColumn(
                name: "IsDraft",
                table: "TestConfigurations");

            migrationBuilder.DropColumn(
                name: "TestTypeId",
                table: "TestConfigurations");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "TestConfigurations");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "TestConfigurations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "TestConfigurations",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
