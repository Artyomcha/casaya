import Foundation
import GoogleMaps3D

/**
 * Камера под набор меток. Повторяет расчёт портала, чтобы карта в приложении
 * и на сайте показывала одно и то же: на карточке объекта — вид с высоты
 * крыш, в выдаче — охват по габаритам всех объектов.
 */
enum CameraFit {
  /** Карточка объекта: наклон меньше, чем кажется нужным, иначе метка уезжает за верхний край низкого блока. */
  static let single = (range: 620.0, tilt: 46.0, heading: 25.0)
  /** Выдача: вид сверху под небольшим наклоном, чтобы читались берег и горы. */
  static let search = (tilt: 35.0, heading: 0.0)

  static let searchPadding = 2.2
  static let searchMinRange = 4_000.0

  private static let earthRadius = 6_371_000.0

  /** Расстояние по большому кругу — им считаем нужный охват. */
  static func distance(_ a: (lat: Double, lng: Double), _ b: (lat: Double, lng: Double)) -> Double {
    let dLat = (b.lat - a.lat) * .pi / 180
    let dLng = (b.lng - a.lng) * .pi / 180
    let h =
      pow(sin(dLat / 2), 2)
      + cos(a.lat * .pi / 180) * cos(b.lat * .pi / 180) * pow(sin(dLng / 2), 2)
    return 2 * earthRadius * asin(min(1, sqrt(h)))
  }

  static func camera(for pins: [Pin3D], variant: String, aspect: Double) -> Camera {
    guard let first = pins.first else {
      return Camera(center: .init(latitude: 38.4, longitude: -0.4), heading: 0, tilt: 45, range: 200_000)
    }

    if variant == "single" {
      return Camera(
        center: .init(latitude: first.lat, longitude: first.lng),
        heading: single.heading,
        tilt: single.tilt,
        roll: 0,
        range: single.range
      )
    }

    let lats = pins.map(\.lat)
    let lngs = pins.map(\.lng)
    let south = lats.min()!, north = lats.max()!
    let west = lngs.min()!, east = lngs.max()!

    let eastWest = distance((south, west), (south, east))
    let northSouth = distance((south, west), (north, west))

    // На узком экране по горизонтали помещается меньше, чем по вертикали,
    // поэтому восток-запад пересчитываем через пропорции экрана.
    let span = max(northSouth, eastWest / max(aspect, 0.3))

    return Camera(
      center: .init(latitude: (south + north) / 2, longitude: (west + east) / 2),
      heading: search.heading,
      tilt: search.tilt,
      roll: 0,
      range: max(searchMinRange, span * searchPadding)
    )
  }
}
