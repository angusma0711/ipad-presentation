using System.Net.Http;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json.Nodes;

namespace IBoard.Companion;

// Firebase ID/refresh tokens stay in memory. No credential or HTTP body is logged.
public sealed class CompanionCloud : IDisposable
{
    private readonly HttpClient http = new() { Timeout = TimeSpan.FromSeconds(8) };
    private readonly string apiKey, project;
    private string token = "", refresh = "";
    private DateTimeOffset renewAt;
    private readonly SemaphoreSlim authLock = new(1, 1);
    public string Uid { get; private set; } = "";
    public DateTimeOffset ServerNow { get; private set; } = DateTimeOffset.UtcNow;
    private DateTimeOffset observedAt = DateTimeOffset.UtcNow;
    public DateTimeOffset Now => ServerNow + (DateTimeOffset.UtcNow - observedAt);
    public CompanionCloud(string projectId, string webApiKey)
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(projectId, "^[a-z][a-z0-9-]{4,62}$") || string.IsNullOrWhiteSpace(webApiKey))
            throw new InvalidOperationException("請填入 Firebase project ID 及 Web API key。");
        project = projectId; apiKey = webApiKey;
    }
    public async Task SignIn(CancellationToken cancel)
    {
        using var response = await http.PostAsync("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + Uri.EscapeDataString(apiKey), new StringContent("{\"returnSecureToken\":true}", Encoding.UTF8, "application/json"), cancel);
        if (!response.IsSuccessStatusCode) throw new InvalidOperationException("Firebase 登入失敗；請核對設定及匿名登入權限。");
        var data = JsonNode.Parse(await response.Content.ReadAsStringAsync(cancel))!;
        token = data["idToken"]!.GetValue<string>(); refresh = data["refreshToken"]!.GetValue<string>(); Uid = data["localId"]!.GetValue<string>(); renewAt = DateTimeOffset.UtcNow.AddMinutes(45);
    }
    private async Task Authorize(CancellationToken cancel)
    {
        await authLock.WaitAsync(cancel);
        try
        {
            if (DateTimeOffset.UtcNow < renewAt) return;
            using var body = new FormUrlEncodedContent(new Dictionary<string, string> { ["grant_type"] = "refresh_token", ["refresh_token"] = refresh });
            using var response = await http.PostAsync("https://securetoken.googleapis.com/v1/token?key=" + Uri.EscapeDataString(apiKey), body, cancel);
            if (!response.IsSuccessStatusCode) throw new InvalidOperationException("登入已失效，請重新配對。");
            var data = JsonNode.Parse(await response.Content.ReadAsStringAsync(cancel))!;
            token = data["id_token"]!.GetValue<string>(); refresh = data["refresh_token"]!.GetValue<string>(); renewAt = DateTimeOffset.UtcNow.AddMinutes(45);
        }
        finally { authLock.Release(); }
    }
    private string Root => $"projects/{project}/databases/(default)";
    public async Task<JsonObject?> Get(string path, CancellationToken cancel)
    {
        await Authorize(cancel);
        using var request = new HttpRequestMessage(HttpMethod.Get, $"https://firestore.googleapis.com/v1/{Root}/documents/{path}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        using var response = await http.SendAsync(request, cancel);
        if (response.Headers.Date is { } date) { ServerNow = date; observedAt = DateTimeOffset.UtcNow; }
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        if (!response.IsSuccessStatusCode) throw new InvalidOperationException("雲端連線未獲允許；請核對遙控規則及配對狀態。");
        return JsonNode.Parse(await response.Content.ReadAsStringAsync(cancel))!.AsObject();
    }
    public async Task Commit(string path, Dictionary<string, object> values, string[] transforms, CancellationToken cancel, string? updateTime = null, bool create = false)
    {
        await Authorize(cancel);
        var fields = new JsonObject(); foreach (var item in values) fields[item.Key] = Field(item.Value);
        var write = new JsonObject { ["update"] = new JsonObject { ["name"] = $"{Root}/documents/{path}", ["fields"] = fields } };
        var timeFields = new JsonArray(); foreach (var name in transforms) timeFields.Add(new JsonObject { ["fieldPath"] = name, ["setToServerValue"] = "REQUEST_TIME" });
        write["updateTransforms"] = timeFields;
        if (create) write["currentDocument"] = new JsonObject { ["exists"] = false };
        else
        {
            write["updateMask"] = new JsonObject { ["fieldPaths"] = new JsonArray(values.Keys.Select(key => (JsonNode?)JsonValue.Create(key)).ToArray()) };
            write["currentDocument"] = updateTime is null ? new JsonObject { ["exists"] = true } : new JsonObject { ["updateTime"] = updateTime };
        }
        using var request = new HttpRequestMessage(HttpMethod.Post, $"https://firestore.googleapis.com/v1/{Root}/documents:commit");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = new StringContent(new JsonObject { ["writes"] = new JsonArray(write) }.ToJsonString(), Encoding.UTF8, "application/json");
        using var response = await http.SendAsync(request, cancel);
        if (!response.IsSuccessStatusCode) throw new InvalidOperationException("雲端更新未獲確認；不會自動重試指令。");
    }
    private static JsonObject Field(object value) => value switch
    {
        string text => new JsonObject { ["stringValue"] = text },
        bool flag => new JsonObject { ["booleanValue"] = flag },
        _ => throw new InvalidOperationException("不支援的欄位。")
    };
    public static string Text(JsonObject? doc, string key) => doc?["fields"]?[key]?["stringValue"]?.GetValue<string>() ?? "";
    public static bool Flag(JsonObject? doc, string key) => doc?["fields"]?[key]?["booleanValue"]?.GetValue<bool>() ?? false;
    public static DateTimeOffset Time(JsonObject? doc, string key) => DateTimeOffset.TryParse(doc?["fields"]?[key]?["timestampValue"]?.GetValue<string>(), out var date) ? date : DateTimeOffset.MinValue;
    public void Dispose() { http.Dispose(); authLock.Dispose(); token = ""; refresh = ""; }
}
