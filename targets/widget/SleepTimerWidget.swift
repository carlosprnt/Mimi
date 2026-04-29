import WidgetKit
import SwiftUI
import AppIntents

private let nightBg = Color(red: 0x0E / 255.0, green: 0x0F / 255.0, blue: 0x12 / 255.0)
private let accent = Color(red: 0xA8 / 255.0, green: 0xA5 / 255.0, blue: 0xE6 / 255.0)
private let textSecondary = Color(red: 0xCC / 255.0, green: 0xC8 / 255.0, blue: 0xE8 / 255.0)
private let textTertiary = Color(red: 0xA4 / 255.0, green: 0xA1 / 255.0, blue: 0xC9 / 255.0)

private struct SleepEntry: TimelineEntry {
    let date: Date
    let state: WidgetState
}

private struct SleepProvider: TimelineProvider {
    func placeholder(in context: Context) -> SleepEntry {
        SleepEntry(date: Date(), state: WidgetState())
    }

    func getSnapshot(
        in context: Context,
        completion: @escaping (SleepEntry) -> Void
    ) {
        completion(SleepEntry(date: Date(), state: SharedStore.read()))
    }

    func getTimeline(
        in context: Context,
        completion: @escaping (Timeline<SleepEntry>) -> Void
    ) {
        let state = SharedStore.read()
        let now = Date()
        // When sleep is active we refresh every minute so the timer
        // ticks up. Otherwise refresh every 15 minutes since suggestions
        // are slow-moving.
        let refreshSeconds: TimeInterval = state.sleepStartedAt != nil ? 60 : 900
        let entry = SleepEntry(date: now, state: state)
        let timeline = Timeline(
            entries: [entry],
            policy: .after(now.addingTimeInterval(refreshSeconds)),
        )
        completion(timeline)
    }
}

private func formatDuration(from start: Date, to end: Date) -> String {
    let secs = max(0, Int(end.timeIntervalSince(start)))
    let h = secs / 3600
    let m = (secs % 3600) / 60
    if h > 0 { return String(format: "%dh %02dm", h, m) }
    return String(format: "%dm", m)
}

private func parseISO(_ s: String?) -> Date? {
    guard let s else { return nil }
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let d = f.date(from: s) { return d }
    f.formatOptions = [.withInternetDateTime]
    return f.date(from: s)
}

@available(iOS 17.0, *)
private struct SleepTimerSmall: View {
    var entry: SleepEntry

    var body: some View {
        let started = parseISO(entry.state.sleepStartedAt)
        ZStack {
            nightBg
            VStack(alignment: .leading, spacing: 6) {
                if let started {
                    Text("DURMIENDO")
                        .font(.system(size: 9, weight: .medium))
                        .tracking(1.6)
                        .foregroundColor(textTertiary)
                    Text(timerInterval: started...Date.distantFuture, countsDown: false)
                        .font(.system(size: 30, weight: .semibold, design: .rounded))
                        .foregroundColor(.white)
                        .monospacedDigit()
                    Spacer()
                    Button(intent: StopSleepIntent()) {
                        HStack(spacing: 6) {
                            Image(systemName: "stop.fill")
                            Text("Parar")
                                .font(.system(size: 13, weight: .medium))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.red.opacity(0.85))
                        .clipShape(Capsule())
                        .foregroundColor(.white)
                    }
                    .buttonStyle(.plain)
                } else {
                    Text(entry.state.babyName ?? "Mimi")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(textSecondary)
                    Text(entry.state.nextActionKind == "night"
                         ? "Hora de dormir"
                         : "Lista la siesta")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                    Spacer()
                    Button(intent: StartSleepIntent()) {
                        HStack(spacing: 6) {
                            Image(systemName: "play.fill")
                            Text("Empezar")
                                .font(.system(size: 13, weight: .medium))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(accent)
                        .clipShape(Capsule())
                        .foregroundColor(.black)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(14)
        }
    }
}

@available(iOS 17.0, *)
private struct SleepTimerMedium: View {
    var entry: SleepEntry

    var body: some View {
        let started = parseISO(entry.state.sleepStartedAt)
        ZStack {
            nightBg
            HStack(alignment: .center, spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    if let started {
                        Text("DURMIENDO")
                            .font(.system(size: 9, weight: .medium))
                            .tracking(1.6)
                            .foregroundColor(textTertiary)
                        Text(timerInterval: started...Date.distantFuture, countsDown: false)
                            .font(.system(size: 38, weight: .semibold, design: .rounded))
                            .foregroundColor(.white)
                            .monospacedDigit()
                        Text(entry.state.sleepKind == "night"
                             ? "Sueño nocturno"
                             : "Siesta")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(textSecondary)
                    } else {
                        Text(entry.state.babyName ?? "Mimi")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(textSecondary)
                        Text(entry.state.nextActionKind == "night"
                             ? "Hora de dormir"
                             : "Lista la siesta")
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundColor(.white)
                        if let body = entry.state.recommendationBody {
                            Text(body)
                                .font(.system(size: 13))
                                .foregroundColor(textTertiary)
                        }
                    }
                }
                Spacer()
                if started != nil {
                    Button(intent: StopSleepIntent()) {
                        Image(systemName: "stop.fill")
                            .font(.system(size: 22, weight: .semibold))
                            .frame(width: 64, height: 64)
                            .background(Color.red.opacity(0.85))
                            .foregroundColor(.white)
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                } else {
                    Button(intent: StartSleepIntent()) {
                        Image(systemName: "play.fill")
                            .font(.system(size: 24, weight: .semibold))
                            .frame(width: 64, height: 64)
                            .background(accent)
                            .foregroundColor(.black)
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(16)
        }
    }
}

@available(iOS 17.0, *)
struct SleepTimerWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "MimiSleepTimer", provider: SleepProvider()) { entry in
            SleepTimerEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Temporizador de sueño")
        .description("Cuánto lleva durmiendo, con play y stop.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@available(iOS 17.0, *)
private struct SleepTimerEntryView: View {
    var entry: SleepEntry

    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemMedium:
            SleepTimerMedium(entry: entry)
        default:
            SleepTimerSmall(entry: entry)
        }
    }
}
