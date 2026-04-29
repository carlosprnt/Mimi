import WidgetKit
import SwiftUI

private let nightBg = Color(red: 0x0E / 255.0, green: 0x0F / 255.0, blue: 0x12 / 255.0)
private let accent = Color(red: 0xA8 / 255.0, green: 0xA5 / 255.0, blue: 0xE6 / 255.0)
private let textSecondary = Color(red: 0xCC / 255.0, green: 0xC8 / 255.0, blue: 0xE8 / 255.0)
private let textTertiary = Color(red: 0xA4 / 255.0, green: 0xA1 / 255.0, blue: 0xC9 / 255.0)

private struct SuggestionEntry: TimelineEntry {
    let date: Date
    let state: WidgetState
}

private struct SuggestionProvider: TimelineProvider {
    func placeholder(in context: Context) -> SuggestionEntry {
        SuggestionEntry(date: Date(), state: WidgetState())
    }

    func getSnapshot(in context: Context, completion: @escaping (SuggestionEntry) -> Void) {
        completion(SuggestionEntry(date: Date(), state: SharedStore.read()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SuggestionEntry>) -> Void) {
        let now = Date()
        let entry = SuggestionEntry(date: now, state: SharedStore.read())
        // Refresh every 5 minutes — recommendation copy changes slowly.
        let timeline = Timeline(
            entries: [entry],
            policy: .after(now.addingTimeInterval(300)),
        )
        completion(timeline)
    }
}

@available(iOS 17.0, *)
struct SuggestionWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "MimiSuggestion", provider: SuggestionProvider()) { entry in
            SuggestionEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Próxima sugerencia")
        .description("Falta poco para la próxima siesta o sueño nocturno.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@available(iOS 17.0, *)
private struct SuggestionEntryView: View {
    var entry: SuggestionEntry

    var body: some View {
        let eyebrow = entry.state.recommendationEyebrow ?? "PRÓXIMO"
        let body = entry.state.recommendationBody ?? "Sin recomendación"
        ZStack {
            nightBg
            VStack(alignment: .leading, spacing: 6) {
                Text(eyebrow.uppercased())
                    .font(.system(size: 10, weight: .medium))
                    .tracking(1.6)
                    .foregroundColor(accent)
                Text(body)
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(3)
                    .minimumScaleFactor(0.7)
                Spacer()
                if let name = entry.state.babyName {
                    Text(name)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(textTertiary)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
