import WidgetKit
import SwiftUI
import AppIntents

// Start button uses a deeper brand violet so white text reads with
// solid contrast. Stop uses red so it parses as destructive at a
// glance without depending on color alone.
private let startBg = Color(red: 0x5F / 255.0, green: 0x55 / 255.0, blue: 0xC8 / 255.0)
private let stopBg = Color(red: 0xC8 / 255.0, green: 0x3A / 255.0, blue: 0x3A / 255.0)

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
        VStack(alignment: .leading, spacing: 6) {
            if let started {
                Text("DURMIENDO")
                    .font(.system(size: 9, weight: .medium))
                    .tracking(1.6)
                    .foregroundStyle(.tertiary)
                Text(timerInterval: started...Date.distantFuture, countsDown: false)
                    .font(.system(size: 30, weight: .semibold))
                    .foregroundStyle(.primary)
                    .monospacedDigit()
                Spacer()
                Button(intent: StopSleepIntent()) {
                    Text("Parar")
                        .font(.system(size: 14, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(stopBg)
                        .clipShape(Capsule())
                        .foregroundStyle(.white)
                }
                .buttonStyle(.plain)
            } else {
                Text(entry.state.babyName ?? "Mimi")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.secondary)
                Text(entry.state.nextActionKind == "night"
                     ? "Hora de dormir"
                     : "Lista la siesta")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.primary)
                Spacer()
                Button(intent: StartSleepIntent()) {
                    Text("Empezar")
                        .font(.system(size: 14, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(startBg)
                        .clipShape(Capsule())
                        .foregroundStyle(.white)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

@available(iOS 17.0, *)
private struct SleepTimerMedium: View {
    var entry: SleepEntry

    var body: some View {
        let started = parseISO(entry.state.sleepStartedAt)
        HStack(alignment: .center, spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                if let started {
                    Text("DURMIENDO")
                        .font(.system(size: 9, weight: .medium))
                        .tracking(1.6)
                        .foregroundStyle(.tertiary)
                    Text(timerInterval: started...Date.distantFuture, countsDown: false)
                        .font(.system(size: 38, weight: .semibold))
                        .foregroundStyle(.primary)
                        .monospacedDigit()
                    Text(entry.state.sleepKind == "night"
                         ? "Sueño nocturno"
                         : "Siesta")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.secondary)
                } else {
                    Text(entry.state.babyName ?? "Mimi")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.secondary)
                    Text(entry.state.nextActionKind == "night"
                         ? "Hora de dormir"
                         : "Lista la siesta")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(.primary)
                    if let body = entry.state.recommendationBody {
                        Text(body)
                            .font(.system(size: 13))
                            .foregroundStyle(.tertiary)
                    }
                }
            }
            Spacer()
            if started != nil {
                Button(intent: StopSleepIntent()) {
                    Text("Parar")
                        .font(.system(size: 15, weight: .semibold))
                        .padding(.horizontal, 22)
                        .padding(.vertical, 14)
                        .background(stopBg)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            } else {
                Button(intent: StartSleepIntent()) {
                    Text("Empezar")
                        .font(.system(size: 15, weight: .semibold))
                        .padding(.horizontal, 22)
                        .padding(.vertical, 14)
                        .background(startBg)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }
        }
    }
}

@available(iOS 17.0, *)
struct SleepTimerWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "MimiSleepTimer", provider: SleepProvider()) { entry in
            SleepTimerEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    Color(UIColor.systemBackground)
                }
        }
        .configurationDisplayName("Temporizador de sueño")
        .description("Cuánto lleva durmiendo, con botones para empezar y parar.")
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
