using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinPulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddTagToExpenses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Tag",
                table: "DailyExpenses",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DailyExpenses_UserId_Tag",
                table: "DailyExpenses",
                columns: new[] { "UserId", "Tag" },
                filter: "[Tag] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DailyExpenses_UserId_Tag",
                table: "DailyExpenses");

            migrationBuilder.DropColumn(
                name: "Tag",
                table: "DailyExpenses");
        }
    }
}
