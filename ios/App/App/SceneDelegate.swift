import UIKit

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private var enteredBackground = false
    private var rebuildingBridge = false

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = AppViewController()
        applyFeltChrome(window)
        window.makeKeyAndVisible()
        self.window = window
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        enteredBackground = true
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        rebuildBridgeAfterBackground()
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        if let window {
            applyFeltChrome(window)
        }
    }

    private func rebuildBridgeAfterBackground() {
        guard enteredBackground, !rebuildingBridge else { return }
        rebuildingBridge = true
        enteredBackground = false

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
            guard let self, let window = self.window else { return }
            window.rootViewController = AppViewController()
            self.applyFeltChrome(window)
            window.makeKeyAndVisible()
            self.rebuildingBridge = false
            NSLog("[lifecycle] scene bridge rebuilt after background")
        }
    }

    private func applyFeltChrome(_ window: UIWindow) {
        let felt = UIColor(red: 0xef / 255.0, green: 0xe5 / 255.0, blue: 0xd9 / 255.0, alpha: 1)
        window.backgroundColor = felt
        window.rootViewController?.view.backgroundColor = felt
    }
}
