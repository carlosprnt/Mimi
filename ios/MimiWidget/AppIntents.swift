import AppIntents
import WidgetKit

/// Starts a sleep session from the widget's play button. The widget
/// just stamps `sleepStartedAt` and tells WidgetKit to refresh — the
/// actual session is created by the RN app the next time it foregrounds
/// (sync-in-background flow).
@available(iOS 17.0, *)
struct StartSleepIntent: AppIntent {
    static var title: LocalizedStringResource = "Empezar a dormir"

    func perform() async throws -> some IntentResult {
        var state = SharedStore.read()
        state.sleepStartedAt = ISO8601DateFormatter().string(from: Date())
        // We don't know the kind here (nap vs night) without app
        // context, so we mirror nextActionKind.
        state.sleepKind = state.nextActionKind ?? "nap"
        SharedStore.write(state)
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

@available(iOS 17.0, *)
struct StopSleepIntent: AppIntent {
    static var title: LocalizedStringResource = "Terminar sueño"

    func perform() async throws -> some IntentResult {
        var state = SharedStore.read()
        state.sleepStartedAt = nil
        state.sleepKind = nil
        SharedStore.write(state)
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}
