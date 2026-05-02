import WidgetKit
import SwiftUI

private let accent = Color(red: 0xA8 / 255.0, green: 0xA5 / 255.0, blue: 0xE6 / 255.0)

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
                .containerBackground(for: .widget) {
                    Color(UIColor.systemBackground)
                }
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
        VStack(alignment: .leading, spacing: 6) {
            Text(eyebrow.uppercased())
                .font(.system(size: 10, weight: .medium))
                .tracking(1.6)
                .foregroundStyle(accent)
            Text(body)
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(.primary)
                .lineLimit(3)
                .minimumScaleFactor(0.7)
            Spacer()
            if let name = entry.state.babyName {
                Text(name)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.tertiary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
