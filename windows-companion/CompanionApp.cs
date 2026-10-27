using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using Microsoft.Win32;

namespace IBoard.Companion;

public sealed class CompanionApp : Application
{
    [STAThread] public static void Main() => new CompanionApp().Run(new CompanionWindow());
}
public sealed class CompanionWindow : Window
{
    private readonly TextBox project = new() { Text = "block-practice" }, chrome = new(), youtube = new(), ebook = new(), presentation = new(), ebookTitle = new(), browserTitle = new();
    private readonly PasswordBox apiKey = new(), pairingCode = new();
    private readonly TextBlock status = new() { TextWrapping = TextWrapping.Wrap }, confirmation = new() { FontSize = 24 };
    private readonly Button create = new() { Content = "產生配對碼" }, allow = new() { Content = "允許控制" }, stop = new() { Content = "停止遙控" }, unpair = new() { Content = "解除配對" };
    private readonly CheckBox permission = new() { Content = "我已獲學校允許在此電腦執行接收程式" };
    private readonly ListBox history = new() { Height = 140 };
    private CompanionSession? session;
    private bool busy;
    public CompanionWindow()
    {
        Title = "I-board · Windows 接收程式（本機開發版）"; Width = 760; Height = 860; MinWidth = 600; MinHeight = 640; FontSize = 16;
        var panel = new StackPanel { Margin = new Thickness(24) };
        Content = new ScrollViewer { Content = panel, VerticalScrollBarVisibility = ScrollBarVisibility.Auto };
        panel.Children.Add(new TextBlock { Text = "I-board 電腦控制", FontSize = 28, FontWeight = FontWeights.Bold });
        panel.Children.Add(new TextBlock { Text = "沒有螢幕分享。只有配對並經你允許的 iPad 可送出固定操作。關閉程式即停止接收。", TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 8, 0, 16) });
        panel.Children.Add(permission);
        Add(panel, "Firebase project ID", project); Add(panel, "Firebase Web API key（只留本次程式記憶體，不儲存）", apiKey);
        Add(panel, "Chrome 執行檔", chrome, () => Pick(chrome, "Chrome|chrome.exe"));
        Add(panel, "YouTube HTTPS 網址（固定教學網址）", youtube);
        Add(panel, "電子課本本機檔案", ebook, () => Pick(ebook, "電子課本|*.pdf;*.html;*.htm;*.epub"));
        Add(panel, "簡報視窗標題關鍵字（須唯一）", presentation);
        Add(panel, "Chrome 視窗標題關鍵字（須唯一）", browserTitle);
        Add(panel, "電子課本視窗標題關鍵字（須唯一）", ebookTitle);
        panel.Children.Add(new TextBlock { Text = "配對碼（隱藏；按複製，貼到 iPad 的電腦控制區）", Margin = new Thickness(0, 16, 0, 4) });
        pairingCode.IsEnabled = false; panel.Children.Add(pairingCode);
        var copy = new Button { Content = "複製配對碼", Margin = new Thickness(0, 6, 0, 6), MinHeight = 42 };
        copy.Click += (_, _) => { if (session?.PairingCode is { Length: > 0 } code) { Clipboard.SetText(code); status.Text = "已複製配對碼。貼到配對的 iPad 後請勿分享或截圖。"; } }; panel.Children.Add(copy);
        panel.Children.Add(new TextBlock { Text = "確認號碼／已配對控制器（與 iPad 核對相同才允許）" }); panel.Children.Add(confirmation);
        var actions = new WrapPanel(); foreach (var button in new[] { create, allow, stop, unpair }) { button.Margin = new Thickness(0, 8, 8, 8); button.Padding = new Thickness(14, 10, 14, 10); actions.Children.Add(button); } panel.Children.Add(actions);
        stop.Background = Brushes.DarkRed; stop.Foreground = Brushes.White; panel.Children.Add(status); panel.Children.Add(new TextBlock { Text = "最近狀態／操作（只保留本次最近8項）" }); panel.Children.Add(history);
        create.Click += async (_, _) => await Guard(async () =>
        {
            if (permission.IsChecked != true) throw new InvalidOperationException("請先取得並確認學校執行許可。");
            if (session is not null) throw new InvalidOperationException("請先解除現有配對。");
            var cloud = new CompanionCloud(project.Text.Trim(), apiKey.Password);
            session = new CompanionSession(cloud, () => new LocalTargets(chrome.Text.Trim(), youtube.Text.Trim(), ebook.Text.Trim(), presentation.Text.Trim(), ebookTitle.Text.Trim(), browserTitle.Text.Trim()), message => { status.Text = message; history.Items.Insert(0, DateTime.Now.ToString("HH:mm:ss") + " " + message); while (history.Items.Count > 8) history.Items.RemoveAt(8); }, value => confirmation.Text = value);
            try { await session.Start(); pairingCode.Password = session.PairingCode; }
            catch { session.Dispose(); session = null; throw; }
        });
        allow.Click += async (_, _) => await Guard(async () =>
        {
            if (session is null) throw new InvalidOperationException("請先配對。");
            if (MessageBox.Show("iPad 與電腦的確認號碼相同，並允許此 iPad 操作本機？", "允許控制", MessageBoxButton.YesNo) != MessageBoxResult.Yes) return;
            await session.Allow();
        });
        stop.Click += async (_, _) => { session?.StopLocal(); if (session is not null) await session.Stop(); };
        unpair.Click += async (_, _) => await Guard(async () => { if (session is null) return; try { await session.Unpair(); } finally { session.Dispose(); session = null; pairingCode.Password = ""; confirmation.Text = ""; } });
        Closing += (_, _) => { session?.StopLocal(); session?.Dispose(); session = null; apiKey.Password = ""; pairingCode.Password = ""; };
    }
    private async Task Guard(Func<Task> work)
    {
        if (busy) return; busy = true; create.IsEnabled = allow.IsEnabled = unpair.IsEnabled = false;
        try { await work(); }
        catch (InvalidOperationException error) { status.Text = error.Message; }
        catch { status.Text = "操作未獲確認。請核對網絡及設定；不會自動執行或重試遙控操作。"; }
        finally { busy = false; create.IsEnabled = allow.IsEnabled = unpair.IsEnabled = true; }
    }
    private static void Pick(TextBox target, string filter) { var dialog = new OpenFileDialog { Filter = filter, CheckFileExists = true }; if (dialog.ShowDialog() == true) target.Text = dialog.FileName; }
    private static void Add(Panel panel, string label, Control input, Action? browse = null)
    {
        panel.Children.Add(new TextBlock { Text = label, Margin = new Thickness(0, 10, 0, 4) }); input.MinHeight = 32;
        if (browse is null) panel.Children.Add(input);
        else { var row = new DockPanel(); var button = new Button { Content = "選擇…", Padding = new Thickness(12, 4, 12, 4) }; button.Click += (_, _) => browse(); DockPanel.SetDock(button, Dock.Right); row.Children.Add(button); row.Children.Add(input); panel.Children.Add(row); }
    }
}
