using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddWeeklyReflection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WeeklyReflections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    WeekStart = table.Column<DateTime>(type: "datetime2", nullable: false),
                    WhatWorked = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WhatHurt = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OneChange = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeeklyReflections", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyReflections_UserId",
                table: "WeeklyReflections",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyReflections_UserId_WeekStart",
                table: "WeeklyReflections",
                columns: new[] { "UserId", "WeekStart" },
                unique: true,
                filter: "[UserId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WeeklyReflections");
        }
    }
}
