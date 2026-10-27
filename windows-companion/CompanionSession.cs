using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;

namespace IBoard.Companion;

public sealed class CompanionSession : IDisposable
{
    private readonly CompanionCloud cloud;
    private readonly Func<LocalTargets> targets;
    private readonly Action<string> status;
    private readonly Action<string> confirmation;
    private readonly CancellationTokenSource cancel = new();
    private readonly HashSet<string> handled = new();
    private Task? polling;
    private string deviceId = "", requestUid = "", controllerUid = "";
    private bool allowed, connected, paired, stopping;
    private int stopGeneration;
    private DateTimeOffset minimumIssuedAt, createdAt, heartbeatAt;
    public string PairingCode { get; private set; } = "";
    private string Path => "remoteDevices/" + deviceId;
    public CompanionSession(CompanionCloud connection, Func<LocalTargets> localTargets, Action<string> onStatus, Action<string> onConfirmation)
    { cloud = connection; targets = localTargets; status = onStatus; confirmation = onConfirmation; }
    public async Task Start()
    {
        await cloud.SignIn(cancel.Token);
        PairingCode = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        deviceId = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(PairingCode))).ToLowerInvariant();
        await cloud.Commit(Path, new() { ["ownerUid"] = cloud.Uid, ["controllerUid"] = "", ["requestUid"] = "", ["confirmation"] = "", ["state"] = "waiting", ["enabled"] = false }, ["createdAt", "updatedAt", "allowAfter", "heartbeat"], cancel.Token, create: true);
        var doc = await cloud.Get(Path, cancel.Token);
        createdAt = CompanionCloud.Time(doc, "createdAt"); minimumIssuedAt = cloud.Now; connected = true;
        status("配對已開始，5分鐘內將配對碼貼到 iPad。不要把配對碼放入網址或截圖。" );
        polling = Poll();
    }
    public async Task Allow()
    {
        if (!connected || stopping) throw new InvalidOperationException("電腦未連線，請等待連線恢復。");
        if (!paired && string.IsNullOrEmpty(requestUid)) throw new InvalidOperationException("尚未收到 iPad 配對要求。");
        if (!paired && cloud.Now - createdAt > TimeSpan.FromMinutes(5)) throw new InvalidOperationException("配對碼已到期，請解除後重新產生。");
        allowed = false;
        var generation = stopGeneration;
        var values = new Dictionary<string, object> { ["state"] = "paired", ["controllerUid"] = paired ? controllerUid : requestUid, ["enabled"] = true };
        await cloud.Commit(Path, values, ["updatedAt", "allowAfter", "heartbeat"], cancel.Token);
        controllerUid = paired ? controllerUid : requestUid; paired = true; minimumIssuedAt = cloud.Now;
        if (generation != stopGeneration || stopping) { allowed = false; return; }
        allowed = true;
        status("已允許配對的 iPad 控制。可隨時按停止遙控。");
    }
    public void StopLocal() { stopGeneration++; allowed = false; status("本機已停止接受遙控。已送交 Windows 的操作不能撤回。"); }
    public async Task Stop()
    {
        StopLocal();
        try { await cloud.Commit(Path, new() { ["enabled"] = false }, ["updatedAt"], cancel.Token); }
        catch { status("本機已停止；雲端狀態未確認。不要繼續在 iPad 發送指令。"); }
    }
    public async Task Unpair()
    {
        StopLocal(); stopping = true;
        try { await cloud.Commit(Path, new() { ["state"] = "revoked", ["enabled"] = false }, ["updatedAt"], cancel.Token); }
        finally { cancel.Cancel(); PairingCode = ""; }
    }
    private async Task Ack(JsonObject command, string state, string message)
    {
        var updateTime = command["updateTime"]!.GetValue<string>();
        await cloud.Commit(Path + "/commands/current", new() { ["state"] = state, ["message"] = message }, ["updatedAt"], cancel.Token, updateTime);
    }
    private async Task ProcessCommand(JsonObject device)
    {
        var command = await cloud.Get(Path + "/commands/current", cancel.Token);
        if (command is null || CompanionCloud.Text(command, "state") != "pending") return;
        var id = CompanionCloud.Text(command, "commandId");
        if (!handled.Add(id)) return;
        var issued = CompanionCloud.Time(command, "issuedAt");
        var expires = CompanionCloud.Time(command, "expiresAt");
        if (!allowed || !connected || !CompanionCloud.Flag(device, "enabled") || CompanionCloud.Text(device, "controllerUid") != controllerUid || CompanionCloud.Text(command, "controllerUid") != controllerUid || issued < minimumIssuedAt || issued < CompanionCloud.Time(device, "allowAfter") || expires <= cloud.Now || expires - issued > TimeSpan.FromSeconds(15))
        { await Ack(command, "expired", "指令已失效，未執行。"); return; }
        // Claim before executing. A failed/uncertain claim is never retried.
        await Ack(command, "accepted", "電腦已接收，等待執行結果。");
        var accepted = await cloud.Get(Path + "/commands/current", cancel.Token);
        if (accepted is null || CompanionCloud.Text(accepted, "commandId") != id || CompanionCloud.Text(accepted, "state") != "accepted") return;
        var latest = await cloud.Get(Path, cancel.Token);
        if (!allowed || !connected || latest is null || CompanionCloud.Text(latest, "state") != "paired" || !CompanionCloud.Flag(latest, "enabled") || CompanionCloud.Time(accepted, "expiresAt") <= cloud.Now)
        { await Ack(accepted, "expired", "本機已停止或指令已到期。"); return; }
        string result, final;
        try { result = WindowsActions.Execute(CompanionCloud.Text(accepted, "action"), targets()); final = "completed"; }
        catch (Exception error) when (error is InvalidOperationException || error is System.ComponentModel.Win32Exception || error is System.IO.IOException)
        { result = error is InvalidOperationException ? error.Message : "Windows 未能執行操作，請在電腦核對應用程式。"; final = "failed"; }
        status(result);
        // If this acknowledgement fails, the controller must not infer successful execution.
        await Ack(accepted, final, result);
    }
    private async Task Poll()
    {
        while (!cancel.IsCancellationRequested)
        {
            try
            {
                var device = await cloud.Get(Path, cancel.Token);
                if (device is null || CompanionCloud.Text(device, "state") == "revoked") { StopLocal(); status("已解除配對。重新控制須產生新配對碼。"); return; }
                if (cloud.Now - createdAt >= TimeSpan.FromHours(1)) { StopLocal(); status("控制時段已到期，請重新配對。"); return; }
                if (!connected) { connected = true; minimumIssuedAt = cloud.Now; allowed = false; status("網絡已恢復。舊指令不會重播；請在電腦重新按允許控制。"); }
                requestUid = CompanionCloud.Text(device, "requestUid");
                confirmation(CompanionCloud.Text(device, "confirmation") + (CompanionCloud.Text(device, "state") == "paired" ? " · 控制器 " + CompanionCloud.Text(device, "controllerUid")[^8..] : ""));
                var state = CompanionCloud.Text(device, "state");
                paired = state == "paired"; controllerUid = CompanionCloud.Text(device, "controllerUid");
                if (cloud.Now - heartbeatAt >= TimeSpan.FromSeconds(5))
                { await cloud.Commit(Path, new(), ["heartbeat", "updatedAt"], cancel.Token); heartbeatAt = cloud.Now; }
                if (paired) await ProcessCommand(device);
            }
            catch (OperationCanceledException) when (cancel.IsCancellationRequested) { return; }
            catch
            {
                connected = false; allowed = false; minimumIssuedAt = cloud.Now;
                status("雲端連線／回應未獲確認，已停止控制。不自動重試操作，請先查看電腦。");
            }
            try { await Task.Delay(2000, cancel.Token); } catch (OperationCanceledException) { return; }
        }
    }
    public void Dispose() { StopLocal(); cancel.Cancel(); PairingCode = ""; /* Cloud disposed after the poll finishes. */ if (polling is null) { cloud.Dispose(); cancel.Dispose(); } else { _ = polling.ContinueWith(_ => { cloud.Dispose(); cancel.Dispose(); }); } }
}
