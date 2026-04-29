import Foundation

/// Reads / writes the JSON snapshot of app state that the widget
/// needs. The main RN app pushes updates via the
/// react-native-shared-group-preferences bridge into the same App
/// Group's UserDefaults under the key `mimiWidgetState`.
struct WidgetState: Codable {
    /// ISO timestamp when the active sleep session started, or nil
    /// when no session is active.
    var sleepStartedAt: String?
    /// 'nap' | 'night' — kind of the active sleep session, if any.
    var sleepKind: String?
    /// Hint for the start button when no sleep is active: 'nap' or
    /// 'night' (depends on time of day relative to bedtime).
    var nextActionKind: String?
    /// Friendly recommendation eyebrow (e.g. "FALTA POCO"). Nil
    /// when no recommendation is available.
    var recommendationEyebrow: String?
    /// Body of the recommendation (e.g. "En 1h 18m").
    var recommendationBody: String?
    /// 7 day labels (newest = last). e.g. ["L", "M", "X", ...].
    var weekLabels: [String]?
    /// Per-day night sleep duration in milliseconds, length 7.
    var weekNightMs: [Double]?
    /// Average night sleep across the week in ms.
    var weekAverageMs: Double?
    /// Active baby's display name.
    var babyName: String?
}

enum SharedStore {
    static let suite = "group.com.carlospariente.mimi"
    static let key = "mimiWidgetState"

    static func read() -> WidgetState {
        guard
            let defaults = UserDefaults(suiteName: suite),
            let raw = defaults.string(forKey: key),
            let data = raw.data(using: .utf8)
        else {
            return WidgetState()
        }
        return (try? JSONDecoder().decode(WidgetState.self, from: data))
            ?? WidgetState()
    }

    static func write(_ state: WidgetState) {
        guard let defaults = UserDefaults(suiteName: suite) else { return }
        if let data = try? JSONEncoder().encode(state),
           let raw = String(data: data, encoding: .utf8) {
            defaults.set(raw, forKey: key)
        }
    }
}
