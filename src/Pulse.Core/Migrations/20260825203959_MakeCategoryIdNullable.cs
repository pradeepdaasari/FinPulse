using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class MakeCategoryIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DailyExpenses_CustomCategories_CategoryId",
                table: "DailyExpenses");

            migrationBuilder.AlterColumn<int>(
                name: "CategoryId",
                table: "DailyExpenses",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_DailyExpenses_CustomCategories_CategoryId",
                table: "DailyExpenses",
                column: "CategoryId",
                principalTable: "CustomCategories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DailyExpenses_CustomCategories_CategoryId",
                table: "DailyExpenses");

            migrationBuilder.AlterColumn<int>(
                name: "CategoryId",
                table: "DailyExpenses",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_DailyExpenses_CustomCategories_CategoryId",
                table: "DailyExpenses",
                column: "CategoryId",
                principalTable: "CustomCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
