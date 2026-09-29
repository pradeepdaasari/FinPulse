using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pulse.Core.Migrations
{
    /// <inheritdoc />
    public partial class FixLoanStatusDefaults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE PersonalLoans SET Status = 'Active' WHERE Status = '' OR Status IS NULL");
            migrationBuilder.Sql("UPDATE PersonalLoans SET Status = 'PaidOff', PaidOffDate = UpdatedAt WHERE CurrentBalance <= 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
