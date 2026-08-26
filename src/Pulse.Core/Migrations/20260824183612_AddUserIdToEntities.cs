using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MonthlySnapshots_Year_Month",
                table: "MonthlySnapshots");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "UserProfiles",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "PersonalLoans",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "PaymentHistories",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "MonthlySnapshots",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "DailyExpenses",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "CreditCards",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "BudgetExpenses",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserProfiles_UserId",
                table: "UserProfiles",
                column: "UserId",
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PersonalLoans_UserId",
                table: "PersonalLoans",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentHistories_UserId",
                table: "PaymentHistories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlySnapshots_Year_Month_UserId",
                table: "MonthlySnapshots",
                columns: new[] { "Year", "Month", "UserId" },
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DailyExpenses_UserId",
                table: "DailyExpenses",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CreditCards_UserId",
                table: "CreditCards",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BudgetExpenses_UserId",
                table: "BudgetExpenses",
                column: "UserId");

            // Assign all existing data to the demo user (pradeep@finpulse.app)
            migrationBuilder.Sql(@"
                DECLARE @DemoUserId NVARCHAR(450);
                SELECT @DemoUserId = Id FROM AspNetUsers WHERE Email = 'pradeep@finpulse.app';

                IF @DemoUserId IS NOT NULL
                BEGIN
                    UPDATE PersonalLoans SET UserId = @DemoUserId WHERE UserId IS NULL;
                    UPDATE CreditCards SET UserId = @DemoUserId WHERE UserId IS NULL;
                    UPDATE BudgetExpenses SET UserId = @DemoUserId WHERE UserId IS NULL;
                    UPDATE DailyExpenses SET UserId = @DemoUserId WHERE UserId IS NULL;
                    UPDATE PaymentHistories SET UserId = @DemoUserId WHERE UserId IS NULL;
                    UPDATE MonthlySnapshots SET UserId = @DemoUserId WHERE UserId IS NULL;
                    UPDATE UserProfiles SET UserId = @DemoUserId WHERE UserId IS NULL;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserProfiles_UserId",
                table: "UserProfiles");

            migrationBuilder.DropIndex(
                name: "IX_PersonalLoans_UserId",
                table: "PersonalLoans");

            migrationBuilder.DropIndex(
                name: "IX_PaymentHistories_UserId",
                table: "PaymentHistories");

            migrationBuilder.DropIndex(
                name: "IX_MonthlySnapshots_Year_Month_UserId",
                table: "MonthlySnapshots");

            migrationBuilder.DropIndex(
                name: "IX_DailyExpenses_UserId",
                table: "DailyExpenses");

            migrationBuilder.DropIndex(
                name: "IX_CreditCards_UserId",
                table: "CreditCards");

            migrationBuilder.DropIndex(
                name: "IX_BudgetExpenses_UserId",
                table: "BudgetExpenses");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "PersonalLoans");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "PaymentHistories");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "MonthlySnapshots");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "DailyExpenses");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "CreditCards");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "BudgetExpenses");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlySnapshots_Year_Month",
                table: "MonthlySnapshots",
                columns: new[] { "Year", "Month" },
                unique: true);
        }
    }
}
