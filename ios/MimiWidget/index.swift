import WidgetKit
import SwiftUI

@main
@available(iOS 17.0, *)
struct MimiWidgetBundle: WidgetBundle {
    var body: some Widget {
        SleepTimerWidget()
        SuggestionWidget()
        WeeklyStatsWidget()
    }
}
