import ExpoModulesCore

public class CasayaMaps3dModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CasayaMaps3d")

    View(CasayaMaps3dView.self) {
      Events("onSelectPin")

      Prop("apiKey") { (view: CasayaMaps3dView, value: String) in
        view.setApiKey(value)
      }
      Prop("pins") { (view: CasayaMaps3dView, value: String) in
        view.setPins(value)
      }
      Prop("camera") { (view: CasayaMaps3dView, value: String) in
        view.setCamera(value)
      }
      Prop("variant") { (view: CasayaMaps3dView, value: String) in
        view.setVariant(value)
      }
    }
  }
}
