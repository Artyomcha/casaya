import GoogleMaps3D
import SwiftUI

/** Камера: центр, наклон, азимут и охват — всё посчитано в JS. */
struct Camera3D: Decodable {
  let lat: Double
  let lng: Double
  let altitude: Double
  let heading: Double
  let tilt: Double
  let range: Double
  /// ground — высота от земли, иначе от уровня моря.
  let altitudeMode: String

  var camera: Camera {
    Camera(
      center: .init(latitude: lat, longitude: lng, altitude: altitude),
      heading: heading,
      tilt: tilt,
      roll: 0,
      range: range,
      altitudeMode: altitudeMode == "ground" ? .relativeToGround : .absolute,
    )
  }
}

/** Метка с ценой: ровно то, что приходит из JS. */
struct Pin3D: Identifiable, Decodable {
  let id: String
  let label: String
  let lat: Double
  let lng: Double
}

/**
 * Фирменная «таблетка» с ценой. Та же, что на портале: белая, с фиолетовой
 * точкой и якорем на земле. Стандартная красная капля Google здесь не нужна —
 * метка должна читаться как часть Casaya, а не как чужая карта.
 */
struct PricePill: View {
  let text: String

  /**
   * Снимок вида карта кладёт на экран пиксель в пункт: на Retina метка
   * выходит втрое крупнее задуманного. Поэтому рисуем её уменьшенной ровно
   * во столько раз, во сколько плотный экран, — после растеризации получается
   * нужный размер.
   */
  private var snapshotScale: CGFloat { 1 / max(UIScreen.main.scale, 1) }

  private static let purple = Color(red: 0.427, green: 0.231, blue: 0.961)
  private static let ink = Color(red: 0.090, green: 0.067, blue: 0.169)
  private static let hairline = Color(red: 0.937, green: 0.925, blue: 0.957)

  var body: some View {
    VStack(spacing: 0) {
      HStack(spacing: 7) {
        Circle().fill(Self.purple).frame(width: 8, height: 8)
        Text(text)
          .font(.system(size: 14, weight: .bold))
          .monospacedDigit()
          .foregroundColor(Self.ink)
      }
      .padding(.horizontal, 12)
      .padding(.vertical, 8)
      .background(
        RoundedRectangle(cornerRadius: 11)
          .fill(Color.white)
          .overlay(RoundedRectangle(cornerRadius: 11).stroke(Self.hairline, lineWidth: 1))
          .shadow(color: Self.ink.opacity(0.42), radius: 4.5, x: 0, y: 3)
      )

      // Хвостик и ножка до якоря: на наклонённой съёмке без них не понять,
      // к какой точке относится цена.
      Triangle()
        .fill(Color.white)
        .frame(width: 14, height: 9)
      Rectangle()
        .fill(Self.purple.opacity(0.85))
        .frame(width: 2, height: 5)
      Circle()
        .fill(Self.purple)
        .overlay(Circle().stroke(Color.white, lineWidth: 2))
        .frame(width: 9, height: 9)
    }
    .scaleEffect(snapshotScale)
  }
}

/** Треугольный хвостик под таблеткой. */
struct Triangle: Shape {
  func path(in rect: CGRect) -> Path {
    var path = Path()
    path.move(to: CGPoint(x: rect.minX, y: rect.minY))
    path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
    path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
    path.closeSubpath()
    return path
  }
}
