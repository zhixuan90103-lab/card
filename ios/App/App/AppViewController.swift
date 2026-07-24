import UIKit
import Capacitor

final class AppViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        applyFeltChrome()
    }

    private func applyFeltChrome() {
        let felt = UIColor(red: 0xef / 255.0, green: 0xe5 / 255.0, blue: 0xd9 / 255.0, alpha: 1)
        view.backgroundColor = felt
        webView?.backgroundColor = felt
        webView?.isOpaque = true
        webView?.scrollView.backgroundColor = felt
    }
}
