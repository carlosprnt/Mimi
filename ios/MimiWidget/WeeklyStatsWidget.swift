import WidgetKit
import SwiftUI

private let accent = Color(red: 0xA8 / 255.0, green: 0xA5 / 255.0, blue: 0xE6 / 255.0)
private let accentSoft = Color(red: 0xA8 / 255.0, green: 0xA5 / 255.0, blue: 0xE6 / 255.0, opacity: 0.30)

private struct WeeklyEntry: TimelineEntry {
    let date: Date
    let state: WidgetState
}

private struct WeeklyProvider: TimelineProvider {
    func placeholder(in context: Context) -> WeeklyEntry {
        WeeklyEntry(date: Date(), state: WidgetState())
    }

    func getSnapshot(in context: Context, completion: @escaping (WeeklyEntry) -> Void) {
        completion(WeeklyEntry(date: Date(), state: SharedStore.read()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WeeklyEntry>) -> Void) {
        let now = Date()
        let entry = WeeklyEntry(date: now, state: SharedStore.read())
        // Refresh once an hour.
        let timeline = Timeline(
            entries: [entry],
            policy: .after(now.addingTimeInterval(3600)),
        )
        completion(timeline)
    }
}

private func formatHours(_ ms: Double) -> String {
    if ms <= 0 { return "—" }
    let h = ms / 3_600_000.0
    return String(format: "%.1fh", h)
}

@available(iOS 17.0, *)
struct WeeklyStatsWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "MimiWeeklyStats", provider: WeeklyProvider()) { entry in
            WeeklyStatsEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    Color(UIColor.systemBackground)
                }
        }
        .configurationDisplayName("Semana de sueño")
        .description("Sueño nocturno por día y media diaria.")
        .supportedFamilies([.systemMedium])
    }
}

@available(iOS 17.0, *)
private struct WeeklyStatsEntryView: View {
    var entry: WeeklyEntry

    var body: some View {
        let labels = entry.state.weekLabels ?? Array(repeating: "—", count: 7)
        let values = entry.state.weekNightMs ?? Array(repeating: 0.0, count: 7)
        let maxV = max(1.0, values.max() ?? 1.0)
        let avgMs = entry.state.weekAverageMs ?? 0
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("ÚLTIMA SEMANA")
                        .font(.system(size: 9, weight: .medium))
                        .tracking(1.6)
                        .foregroundStyle(.tertiary)
                    Text("Sueño nocturno")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("MEDIA")
                        .font(.system(size: 9, weight: .medium))
                        .tracking(1.6)
                        .foregroundStyle(.tertiary)
                    Text(formatHours(avgMs))
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(.primary)
                        .monospacedDigit()
                }
            }

            GeometryReader { geo in
                let n = max(1, values.count)
                let gap: CGFloat = 6
                let totalGap = gap * CGFloat(n - 1)
                let colW = (geo.size.width - totalGap) / CGFloat(n)
                HStack(alignment: .bottom, spacing: gap) {
                    ForEach(Array(values.enumerated()), id: \.offset) { idx, v in
                        VStack(spacing: 4) {
                            Spacer(minLength: 0)
                            RoundedRectangle(cornerRadius: 4, style: .continuous)
                                .fill(v <= 0 ? accentSoft : accent)
                                .frame(
                                    width: colW,
                                    height: max(2, CGFloat(v / maxV) * (geo.size.height - 18)),
                                )
                            Text(idx < labels.count ? labels[idx] : "")
                                .font(.system(size: 9, weight: .medium))
                                .foregroundStyle(.tertiary)
                                .frame(width: colW)
                        }
                    }
                }
            }
        }
    }
}
