package es.casaya.maps3d

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CasayaMaps3dModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CasayaMaps3d")

    View(CasayaMaps3dView::class) {
      Events("onSelectPin")

      Prop("apiKey") { view: CasayaMaps3dView, value: String ->
        view.setApiKey(value)
      }
      Prop("pins") { view: CasayaMaps3dView, value: String ->
        view.setPins(value)
      }
      Prop("variant") { view: CasayaMaps3dView, value: String ->
        view.setVariant(value)
      }
    }
  }
}
