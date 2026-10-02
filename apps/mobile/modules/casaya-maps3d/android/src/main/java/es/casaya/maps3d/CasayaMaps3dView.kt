package es.casaya.maps3d

import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.util.AttributeSet
import android.view.ViewGroup
import com.google.android.gms.maps3d.GoogleMap3D
import com.google.android.gms.maps3d.Map3DView
import com.google.android.gms.maps3d.OnMap3DClickListener
import com.google.android.gms.maps3d.OnMap3DViewReadyCallback
import com.google.android.gms.maps3d.model.AltitudeMode
import com.google.android.gms.maps3d.model.Camera
import com.google.android.gms.maps3d.model.CollisionBehavior
import com.google.android.gms.maps3d.model.Glyph
import com.google.android.gms.maps3d.model.Map3DMode
import com.google.android.gms.maps3d.model.Marker
import com.google.android.gms.maps3d.model.latLngAltitude
import com.google.android.gms.maps3d.model.markerOptions
import com.google.android.gms.maps3d.model.pinConfiguration
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import org.json.JSONArray
import org.json.JSONObject

/**
 * Нативная 3D-карта Google внутри React Native.
 *
 * Map3DView — обычный Android View со своим жизненным циклом, поэтому он
 * просто вкладывается в ExpoView, а карта доезжает колбэком.
 *
 * Метка на Android — фиолетовая капля с ценой подписью рядом. Такой же
 * «таблетки», как на портале и в iOS, здесь не сделать: стиль метки
 * принимает либо цвет с глифом, либо drawable из ресурсов, а цена у каждого
 * объекта своя и в ресурсы её не положишь.
 */
/** Метка с ценой — ровно то, что приходит из JS. */
data class Pin3D(val id: String, val label: String, val lat: Double, val lng: Double)

class CasayaMaps3dView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext), OnMap3DViewReadyCallback {

  private val onSelectPin by EventDispatcher()

  private val mapView = Map3DView(context, null as AttributeSet?)
  private var map: GoogleMap3D? = null
  private val markers = mutableListOf<Marker>()

  private var pins: List<Pin3D> = emptyList()
  private var camera: Camera? = null
  private var variant = "search"

  /** Фирменный фиолетовый Casaya. */
  private val purple = Color.parseColor("#6D3BF5")
  private val purpleDark = Color.parseColor("#4B21C6")

  init {
    addView(
      mapView,
      ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      ),
    )
    mapView.onCreate(Bundle())
    mapView.onStart()
    mapView.onResume()
    mapView.getMap3DViewAsync(this)
  }

  fun setApiKey(key: String) {
    // Ключ Android берёт из манифеста (com.google.android.geo.maps3d.API_KEY).
    // Здесь он нужен только чтобы JS мог выключить карту, не передав его.
  }

  fun setPins(json: String) {
    // Метки приезжают строкой JSON: так не нужно описывать Record на каждое
    // поле, а форма данных одна и та же на всех трёх платформах.
    val parsed = mutableListOf<Pin3D>()
    runCatching {
      val array = JSONArray(json)
      for (i in 0 until array.length()) {
        val item = array.getJSONObject(i)
        parsed.add(
          Pin3D(
            id = item.getString("id"),
            label = item.getString("label"),
            lat = item.getDouble("lat"),
            lng = item.getDouble("lng"),
          ),
        )
      }
    }
    pins = parsed
    draw()
  }

  /** Камеру считает JS: одна формула на обе платформы. */
  fun setCamera(json: String) {
    runCatching {
      val o = JSONObject(json)
      camera = Camera(
        latLngAltitude {
          latitude = o.getDouble("lat")
          longitude = o.getDouble("lng")
          altitude = o.getDouble("altitude")
        },
        o.getDouble("heading"),
        o.getDouble("tilt"),
        0.0,
        o.getDouble("range"),
        if (o.getString("altitudeMode") == "ground") {
          AltitudeMode.RELATIVE_TO_GROUND
        } else {
          AltitudeMode.ABSOLUTE
        },
      )
    }
    draw()
  }

  fun setVariant(value: String) {
    variant = value
    draw()
  }

  override fun onMap3DViewReady(googleMap3D: GoogleMap3D) {
    map = googleMap3D
    // Нажатие приходит с идентификатором метки — тем самым, что мы ей задали.
    googleMap3D.setMap3DClickListener(
      OnMap3DClickListener { _, markerId ->
        if (markerId != null) onSelectPin(mapOf("id" to markerId))
      },
    )
    draw()
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    super.onLayout(changed, l, t, r, b)
    mapView.layout(0, 0, r - l, b - t)
    if (changed) draw()
  }

  private fun draw() {
    val googleMap3D = map ?: return
    val view = camera ?: return
    if (pins.isEmpty() || width == 0 || height == 0) return

    val single = variant == "single"
    // На карточке объекта — чистая съёмка: вывески кафе спорят с нашей меткой,
    // а адрес и так написан над картой. В выдаче подписи нужны: по ним видно,
    // какой это город.
    googleMap3D.setMapMode(if (single) Map3DMode.SATELLITE else Map3DMode.HYBRID)

    for (marker in markers) marker.remove()
    markers.clear()

    googleMap3D.setCamera(view)

    for (pin in pins) {
      val marker = googleMap3D.addMarker(
        markerOptions {
          id = pin.id
          position = latLngAltitude {
            latitude = pin.lat
            longitude = pin.lng
            // На карточке метка кладётся на саму геометрию: на нулевой высоте
            // она тонет в рельефе, а поднятая уезжает за край низкого блока.
            altitude = if (single) 4.0 else 28.0
          }
          altitudeMode =
            if (single) AltitudeMode.RELATIVE_TO_MESH else AltitudeMode.RELATIVE_TO_GROUND
          collisionBehavior = CollisionBehavior.REQUIRED
          isExtruded = !single
          isDrawnWhenOccluded = true
          isSizePreserved = true
          label = pin.label
          setStyle(
            pinConfiguration {
              backgroundColor = purple
              borderColor = purpleDark
              setGlyph(Glyph.fromColor(Color.WHITE))
            },
          )
        },
      ) ?: continue
      markers.add(marker)
    }
  }
}
