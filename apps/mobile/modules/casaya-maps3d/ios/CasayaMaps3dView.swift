import ExpoModulesCore
import GoogleMaps3D
import SwiftUI

/**
 * Нативная 3D-карта Google внутри React Native.
 *
 * Карта у Google объявлена как SwiftUI-представление, поэтому живёт
 * в UIHostingController, а наружу выставляется обычным UIView.
 */
public final class CasayaMaps3dView: ExpoView {
  let onSelectPin = EventDispatcher()

  private var pins: [Pin3D] = []
  private var camera: Camera3D?
  private var variant = "search"
  private var host: UIHostingController<AnyView>?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }

  func setApiKey(_ key: String) {
    guard !key.isEmpty, Map.apiKey != key else { return }
    Map.apiKey = key
    render()
  }

  func setPins(_ json: String) {
    // Метки приезжают строкой JSON: так не нужно описывать Record для каждого
    // поля, а форма у данных одна и та же на всех трёх платформах.
    guard let data = json.data(using: .utf8),
      let parsed = try? JSONDecoder().decode([Pin3D].self, from: data)
    else { return }
    pins = parsed
    render()
  }

  func setCamera(_ json: String) {
    guard let data = json.data(using: .utf8),
      let parsed = try? JSONDecoder().decode(Camera3D.self, from: data)
    else { return }
    camera = parsed
    render()
  }

  func setVariant(_ value: String) {
    variant = value
    render()
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    host?.view.frame = bounds
    if host == nil { render() }
  }

  private func render() {
    guard !pins.isEmpty, let camera, bounds.width > 0, bounds.height > 0 else { return }

    let single = variant == "single"
    let select: (String) -> Void = { [weak self] id in self?.onSelectPin(["id": id]) }

    let root = AnyView(
      MapScene(pins: pins, camera: camera.camera, single: single, onSelect: select)
        .ignoresSafeArea()
    )

    if let host {
      host.rootView = root
      return
    }

    let controller = UIHostingController(rootView: root)
    controller.view.frame = bounds
    controller.view.backgroundColor = .clear
    controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(controller.view)
    host = controller
  }
}

/** Сама сцена: подложка, метки и реакция на нажатие. */
struct MapScene: View {
  let pins: [Pin3D]
  let camera: Camera
  let single: Bool
  let onSelect: (String) -> Void

  var body: some View {
    // На карточке объекта — чистая съёмка: вывески кафе спорят с нашей меткой,
    // а адрес и так написан над картой. В выдаче подписи нужны: по ним понятно,
    // какой это город.
    Map(initialCamera: camera, mode: single ? .satellite : .hybrid) {
      ForEach(pins) { pin in
        Marker3D(
          position: .init(
            latitude: pin.lat,
            longitude: pin.lng,
            altitude: single ? 4 : 28
          ),
          // На карточке метка кладётся на саму геометрию: на нулевой высоте
          // она тонет в рельефе, а поднятая уезжает за край низкого блока.
          altitudeMode: single ? .relativeToMesh : .relativeToGround,
          collisionBehavior: .required,
          extruded: !single,
          drawsWhenOccluded: true,
          sizePreserved: true,
          label: "",
          style: .viewSnapshot { PricePill(text: pin.label) }
        )
        .onTap { onSelect(pin.id) }
      }
    }
  }
}
