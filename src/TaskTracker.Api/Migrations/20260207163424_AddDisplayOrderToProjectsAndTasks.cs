using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskTracker.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDisplayOrderToProjectsAndTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "Tasks",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "Projects",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_DisplayOrder",
                table: "Tasks",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_DisplayOrder",
                table: "Projects",
                column: "DisplayOrder");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tasks_DisplayOrder",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Projects_DisplayOrder",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "Projects");
        }
    }
}
