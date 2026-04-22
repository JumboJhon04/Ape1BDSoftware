using System.Security.Claims;

namespace SistemaInventario.API.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static bool TryGetUserId(this ClaimsPrincipal user, out int userId)
        {
            userId = 0;

            var value = user.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? user.FindFirstValue("sub");

            return int.TryParse(value, out userId);
        }
    }
}
