using System.IO;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

namespace IBoard.Companion;

public sealed record LocalTargets(string Chrome, string YouTube, string Ebook, string PresentationTitle, string EbookTitle, string BrowserTitle);
public static class WindowsActions
{
    [DllImport("user32.dll")] private static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] private static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] private static extern bool ShowWindow(IntPtr hWnd, int command);
    [DllImport("user32.dll")] private static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr hWnd);
    private delegate bool WindowCallback(IntPtr window, IntPtr parameter);
    [DllImport("user32.dll")] private static extern bool EnumWindows(WindowCallback callback, IntPtr parameter);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetWindowText(IntPtr window, StringBuilder title, int maximum);
    [DllImport("user32.dll", SetLastError = true)] private static extern uint SendInput(uint count, Input[] inputs, int size);
    [StructLayout(LayoutKind.Sequential)] private struct Input { public uint Type; public InputUnion Data; }
    [StructLayout(LayoutKind.Explicit)] private struct InputUnion { [FieldOffset(0)] public Keyboard Keyboard; [FieldOffset(0)] public Mouse Mouse; }
    [StructLayout(LayoutKind.Sequential)] private struct Keyboard { public ushort Key, Scan; public uint Flags, Time; public UIntPtr Extra; }
    [StructLayout(LayoutKind.Sequential)] private struct Mouse { public int X, Y; public uint Data, Flags, Time; public UIntPtr Extra; }
    private static Input Key(ushort key, bool up) => new() { Type = 1, Data = new InputUnion { Keyboard = new Keyboard { Key = key, Flags = up ? 2u : 0u } } };
    private static void Press(ushort key)
    {
        var inputs = new[] { Key(key, false), Key(key, true) };
        if (SendInput((uint)inputs.Length, inputs, Marshal.SizeOf<Input>()) != inputs.Length) throw new InvalidOperationException("Windows 未接受媒體按鍵；請在電腦操作。");
    }
    private static string Focus(string match)
    {
        if (string.IsNullOrWhiteSpace(match)) throw new InvalidOperationException("請先在接收程式設定該視窗的標題關鍵字。");
        var found = new List<IntPtr>();
        EnumWindows((window, _) => { var title = new StringBuilder(1024); GetWindowText(window, title, title.Capacity); if (IsWindowVisible(window) && title.ToString().Contains(match, StringComparison.OrdinalIgnoreCase)) found.Add(window); return true; }, IntPtr.Zero);
        if (found.Count != 1) throw new InvalidOperationException(found.Count == 0 ? "未找到指定視窗。" : "找到多個相符視窗，請使用更明確的標題關鍵字。");
        var handle = found[0]; if (IsIconic(handle)) ShowWindow(handle, 9);
        if (!SetForegroundWindow(handle) || GetForegroundWindow() != handle) throw new InvalidOperationException("Windows 拒絕切換前景視窗，請在電腦操作。");
        return "已切換至指定視窗。";
    }
    private static void OpenChrome(LocalTargets targets, string? url = null)
    {
        if (!Path.IsPathFullyQualified(targets.Chrome) || !File.Exists(targets.Chrome) || !Path.GetFileName(targets.Chrome).Equals("chrome.exe", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("請在接收程式選擇有效的 chrome.exe。");
        var info = new ProcessStartInfo(targets.Chrome) { UseShellExecute = false };
        if (url is not null)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.Scheme != "https" || !new[] { "youtube.com", "www.youtube.com", "youtu.be" }.Contains(uri.Host.ToLowerInvariant()) || !string.IsNullOrEmpty(uri.UserInfo)) throw new InvalidOperationException("請在接收程式設定有效的 HTTPS YouTube 網址。");
            info.ArgumentList.Add(uri.AbsoluteUri);
        }
        _ = Process.Start(info) ?? throw new InvalidOperationException("未能啟動 Chrome。");
    }
    public static string Execute(string action, LocalTargets targets) => action switch
    {
        "focus-presentation" => Focus(targets.PresentationTitle),
        "focus-browser" => Focus(targets.BrowserTitle),
        "focus-ebook" => Focus(targets.EbookTitle),
        "open-browser" => LaunchBrowser(targets, false),
        "open-approved-url" => LaunchBrowser(targets, true),
        "open-ebook" => OpenEbook(targets),
        "next-window" => NextWindow(),
        "media-toggle" => Media(0xB3, "已傳送播放／暫停按鍵；由 Windows 媒體工作階段處理。"),
        "volume-up" => Media(0xAF, "已傳送一次音量增加按鍵。"),
        "volume-down" => Media(0xAE, "已傳送一次音量減少按鍵。"),
        "mute-toggle" => Media(0xAD, "已傳送靜音切換按鍵。"),
        _ => throw new InvalidOperationException("不支援的指令。")
    };
    private static string LaunchBrowser(LocalTargets targets, bool url) { OpenChrome(targets, url ? targets.YouTube : null); return "已要求開啟 Chrome" + (url ? " 及設定的 YouTube 網址" : "") + "；未確認前景視窗或影片播放。"; }
    private static string OpenEbook(LocalTargets targets)
    {
        var path = targets.Ebook;
        if (!Path.IsPathFullyQualified(path) || path.StartsWith("\\\\") || !File.Exists(path) || !new[] { ".pdf", ".html", ".htm", ".epub" }.Contains(Path.GetExtension(path).ToLowerInvariant())) throw new InvalidOperationException("請設定本機 PDF／HTML／EPUB 課本檔案；不接受腳本、捷徑或網絡路徑。");
        _ = Process.Start(new ProcessStartInfo(path) { UseShellExecute = true }) ?? throw new InvalidOperationException("未能開啟課本，請核對關聯程式。");
        return "已要求用關聯程式開啟電子課本；未確認已置前。";
    }
    private static string Media(ushort key, string result) { Press(key); return result; }
    private static string NextWindow()
    {
        var before = GetForegroundWindow();
        var inputs = new[] { Key(0x12, false), Key(0x09, false), Key(0x09, true), Key(0x12, true) };
        if (SendInput((uint)inputs.Length, inputs, Marshal.SizeOf<Input>()) != inputs.Length) throw new InvalidOperationException("Windows 未接受視窗切換按鍵。");
        return "已傳送 Alt+Tab；請查看電腦確認切換結果。";
    }
}
