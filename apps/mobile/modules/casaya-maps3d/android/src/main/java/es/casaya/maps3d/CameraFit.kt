package es.casaya.maps3d

import com.google.android.gms.maps3d.model.Camera
import com.google.android.gms.maps3d.model.camera
import com.google.android.gms.maps3d.model.latLngAltitude
import kotlin.math.PI
import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt

/** Метка с ценой — ровно то, что приходит из JS. */
data class Pin3D(val id: String, val label: String, val lat: Double, val lng: Double)

/**
 * Камера под набор меток. Повторяет расчёт портала и iOS, чтобы карта
 * выглядела одинаково везде: на карточке объекта — вид с высоты крыш,
 * в выдаче — охват по габаритам всех объектов.
 */
object CameraFit {
  private const val EARTH_RADIUS = 6_371_000.0

  /** Карточка объекта: наклон меньше, иначе метка уезжает за верх низкого блока. */
  private const val SINGLE_RANGE = 620.0
  private const val SINGLE_TILT = 46.0
  private const val SINGLE_HEADING = 25.0

  private const val SEARCH_TILT = 35.0
  private const val SEARCH_PADDING = 2.2
  private const val SEARCH_MIN_RANGE = 4_000.0

  /** Расстояние по большому кругу — им считаем нужный охват. */
  fun distance(lat1: Double, lng1: Double, lat2: Double, lng2: Double): Double {
    val dLat = (lat2 - lat1) * PI / 180
    val dLng = (lng2 - lng1) * PI / 180
    val h = sin(dLat / 2) * sin(dLat / 2) +
      cos(lat1 * PI / 180) * cos(lat2 * PI / 180) * sin(dLng / 2) * sin(dLng / 2)
    return 2 * EARTH_RADIUS * asin(min(1.0, sqrt(h)))
  }

  fun camera(pins: List<Pin3D>, variant: String, aspect: Double): Camera {
    val first = pins.firstOrNull()
      ?: return camera {
        center = latLngAltitude { latitude = 38.4; longitude = -0.4; altitude = 0.0 }
        heading = 0.0
        tilt = 45.0
        range = 200_000.0
      }

    if (variant == "single") {
      return camera {
        center = latLngAltitude { latitude = first.lat; longitude = first.lng; altitude = 0.0 }
        heading = SINGLE_HEADING
        tilt = SINGLE_TILT
        range = SINGLE_RANGE
      }
    }

    val south = pins.minOf { it.lat }
    val north = pins.maxOf { it.lat }
    val west = pins.minOf { it.lng }
    val east = pins.maxOf { it.lng }

    val eastWest = distance(south, west, south, east)
    val northSouth = distance(south, west, north, west)

    // На узком экране по горизонтали помещается меньше, чем по вертикали,
    // поэтому восток-запад пересчитываем через пропорции экрана.
    val span = maxOf(northSouth, eastWest / maxOf(aspect, 0.3))

    return camera {
      center = latLngAltitude {
        latitude = (south + north) / 2
        longitude = (west + east) / 2
        altitude = 0.0
      }
      heading = 0.0
      tilt = SEARCH_TILT
      range = maxOf(SEARCH_MIN_RANGE, span * SEARCH_PADDING)
    }
  }
}
